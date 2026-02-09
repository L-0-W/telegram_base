use futures::future::join_all;
use teloxide::types::{FileId, InputFile};
use teloxide::{prelude::*};
use tokio::fs;
use std::fs::OpenOptions;
use std::io;
use std::path::PathBuf;
use std::io::Write;
use tokio::task::JoinHandle;
use tokio::time::Duration;
use crate::parser::{self, FileData};
use teloxide::net::Download;

struct ChunkIterator {
    data: Vec<String>,
    position: usize,
    chunk_size: usize,
}

impl ChunkIterator {
    fn new(data: Vec<String>, chunk_size: usize) -> Self {
        Self {
            data,
            position: 0,
            chunk_size,
        }
    }
}

impl Iterator for ChunkIterator {
    type Item = Vec<String>; // ou &mut [T] se preferir referências
    
    fn next(&mut self) -> Option<Self::Item> {
        if self.position >= self.data.len() {
            return None;
        }
        
        let end = (self.position + self.chunk_size).min(self.data.len());
        let chunk = self.data[self.position..end].to_vec();
        self.position = end;
        
        Some(chunk)
    }
}

pub async fn bot_on() {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120)) // 2 minutos
        .build()
        .expect("Erro ao criar cliente");
 
    let bot = Bot:: from_env_with_client(client);
    let chat_id = ChatId(5450426834);


    loop {

        let mut choice = String::new();
        let mut file_data_blocks = FileData::default();

        println!("1 > Baixar | 2 > Enviar");

        io::stdin().read_line(&mut choice).expect("Não foi possivel ler input");

        if choice == "1\n" {
            

            let mut file_name = String::new();
            println!("Digite o nome do arquivo que deseja baixar: ");
            io::stdin().read_line(&mut file_name).expect("Não foi possivel ler input");


            file_name.pop();

            crate::parser::build_file_data(file_name.clone(), &mut file_data_blocks);
            crate::bot::get_file(bot.clone(), file_name, &mut file_data_blocks).await;

        }  else if choice == "2\n" {

            println!("Digite o arquivo que deseja enviar: ");

            let mut path_file = String::new();
        
            io::stdin().read_line(&mut path_file).expect("Não foi possivel ler");

            path_file.pop();

            println!("Path: {:?}", path_file);
            let path = PathBuf::from(format!("./video_holder/{}", path_file));

            if path.exists() {
                println!("Arquivo encontrado, separando e enviando....");

                parser::break_file(path_file.as_str(), &mut file_data_blocks);
        
                let files_to_send = parser::list_files(path_file.clone());
                
                let mut chunk_iter = ChunkIterator::new(files_to_send, 50);
                let mut batch_num = 1;
                
                while let Some(chunk) = chunk_iter.next() {
                    println!("Batch {}: {} elementos (índices {} a {})", 
                        batch_num,
                        chunk.len(),
                        (batch_num - 1) * 50,
                        (batch_num - 1) * 50 + chunk.len() - 1
                    );
                    
                    let mut handlers: Vec<JoinHandle<()>> = Vec::new();
                    
                    bot_send_files(chunk, bot.clone(), path_file.clone(), chat_id, &mut handlers);
                    join_all(handlers).await;  
                    
                    batch_num += 1;
                }    
                
                let mut file_data = OpenOptions::new()
                    .append(true)
                    .open("./database/data.index").expect("Não foi possivel escreve em arquivo de ids");
                
                
                file_data_blocks.set_initial_line(parser::get_next_index());

                writeln!(file_data, "{}|{}|{}", path_file, file_data_blocks.get_initial_line(), file_data_blocks.get_total_lines()).expect("a");

                std::fs::remove_dir_all(format!("{}-blocks_holder", path_file));
            } else {
                println!("Arquivo não encontrado, tente novamente");
            }

        } else {
            println!("Opção não e valida");
        }
}    

}


pub fn bot_send_files(files_to_send: Vec<String>, bot: Bot, path_files: String, chat_id: ChatId, handlers: &mut Vec<JoinHandle<()>>) {
    for file in files_to_send {
            let handler = thread_send_file(file, bot.clone(), path_files.clone(), chat_id);
            handlers.push(handler);
       
    }       
}

pub fn thread_send_file(file: String, bot: Bot, path_files: String, chat_id: ChatId) -> JoinHandle<()> {

    let bot_thread = bot.clone();
    let path_files_thread = path_files.clone();
    
    let handler = tokio::spawn(async move {              
        
        println!("{}", file);
        
        send_file(file, bot_thread, path_files_thread, chat_id).await; 
    });

    
    handler
}

pub async fn send_file(file: String, bot_thread: Bot, path_files_thread: String, chat_id: ChatId) {
    let result_sender = bot_thread.send_document(chat_id, InputFile::file(file.clone())).await;
    
    if let Ok(msg) = result_sender {
        
        if let Some(doc) = msg.document() {
            let file_id = &doc.file.id;
            
            println!("{}", file_id);
            
            let mut file_data = OpenOptions::new()
            .append(true)
            .open("./database/data.block").expect("Não foi possivel escreve em arquivo de ids");

            
            writeln!(file_data, "{} | {}", file_id, path_files_thread.clone()).expect("a");
            std::fs::remove_file(file.clone()).expect("Arquivo não foi possivel remover");
        }
        
    } else {
        println!("{:?}", result_sender);
        println!("Arquivo que não foi enviado: {} - Tentando novamente", file.clone());

        Box::pin(async move {
            send_file(file, bot_thread, path_files_thread, chat_id).await;
        }).await;
    }
    
}


pub async fn get_file(bot: Bot, file_name: String, file_data: &mut FileData) {
    
    parser::get_file_blocks(file_name, file_data);

    let names = file_data.clone().get_memory_blocks_names();
    let ids = file_data.clone().get_memory_blocks_ids();
    
    for (idx, mut id) in ids.into_iter().enumerate() {
        id.pop().expect("abc");
        let file = bot.get_file(FileId(String::from(id))).await.expect("abc");
        
        println!("{}", names[idx]);
        let mut dst = fs::File::create(format!("./data/{}", names[idx].split_whitespace().next().expect("a"))).await.expect("ad");
        
        bot.download_file(&file.path, &mut dst).await.expect("adf");
    }
    
    parser::rebuild_blocks(&file_data.clone());
    
}
