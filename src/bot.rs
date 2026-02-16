use futures::future::join_all;
use teloxide::types::{FileId, InputFile};
use teloxide::{prelude::*, utils::command::BotCommands};
use tokio::fs;
use std::fs::OpenOptions;

use std::io::{self, Write};
use std::path::PathBuf;
use tokio::task::JoinHandle;
use tokio::time::Duration;
use teloxide::net::Download;

use crate::parser::{self, FileData};

struct ChunkIterator {
    data: Vec<String>,
    position: usize,
    chunk_size: usize,
}

#[derive(BotCommands, Clone)]
#[command(rename_rule = "lowercase", description = "Esses comandos são suportados")]
enum Command {
    #[command(description = "Cadastrar no telegram_base")]
    Cadastrar,
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



pub async fn bot_on(file_name: String, path_file: PathBuf, choice: u8) {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .connect_timeout(Duration::from_secs(60))
        .build()
        .expect("Erro ao criar cliente");
 
    let bot = Bot:: from_env_with_client(client);
    let chat_id = ChatId(5450426834);

    parser::build_database();

    let mut file_data_blocks: FileData = FileData::default();

    if choice == 1 {
        crate::parser::build_file_data(file_name.clone(), &mut file_data_blocks);
        crate::bot::get_file(bot.clone(), file_name, &mut file_data_blocks).await;

    } else if choice == 2 {     
            if path_file.exists() {
                println!("Arquivo encontrado, separando e enviando....");
                
                parser::break_file(&file_name, path_file.to_str().expect(""), &mut file_data_blocks);
                
                let files_to_send = parser::list_files(file_name.clone());
                
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
                
                bot_send_files(chunk, bot.clone(), chat_id, &mut handlers);
                join_all(handlers).await;  
                
                batch_num += 1;
            }    
            
            let mut file_data = OpenOptions::new()
            .append(true)
            .open("./database/data.index").expect("Não foi possivel escreve em arquivo de ids");
            
            
            file_data_blocks.set_initial_line(parser::get_next_index());
            
            writeln!(file_data, "{}|{}|{}", file_name, file_data_blocks.get_initial_line(), file_data_blocks.get_total_lines()).expect("a");
            
            std::fs::remove_dir_all(format!("{}-blocks_holder", file_name)).expect("Erro ao tentar remover pasta");
        } else {
            println!("Arquivo não encontrado, tente novamente");
        }

    } else {
        println!("escolha não econtrada");
    }

}

async fn answer_command(bot: Bot, msg: Message, cmd: Command) -> ResponseResult<()> {
    match cmd {
        Command::Cadastrar => println!("A")
    }

    Ok(())
}

pub fn bot_send_files(files_to_send: Vec<String>, bot: Bot, chat_id: ChatId, handlers: &mut Vec<JoinHandle<()>>) {
    for file in files_to_send {
            let handler = thread_send_file(file, bot.clone(), chat_id);
            handlers.push(handler);
    }       
}

pub fn thread_send_file(file: String, bot: Bot, chat_id: ChatId) -> JoinHandle<()> {

    let bot_thread = bot.clone();
    let path_files_thread = file.clone().split("/").collect::<Vec<&str>>()[1].to_string();
    
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

    if let Ok(false) = std::fs::exists("./data") {
         std::fs::create_dir("./data").expect("Não foi possivel criar pasta data");
    }
    
    for (idx, mut id) in ids.into_iter().enumerate() {
        id.pop().expect("abc");
        let file = bot.get_file(FileId(String::from(id))).await.expect("abc");
        
        println!("arquivo para download: {}", names[idx]);
        let mut dst = fs::File::create(format!("./data/{}", names[idx].split_whitespace().next().expect("a"))).await.expect("ad");
        
        println!("re");
        
       bot.download_file(&file.path, &mut dst).await.expect("msg");
    }
    
    println!("re_comp_comp");
    parser::rebuild_blocks(&file_data.clone());
    
}
