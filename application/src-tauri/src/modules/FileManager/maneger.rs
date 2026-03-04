use futures::future::join_all;
use tokio::fs;
use std::collections::HashMap;
use std::fs::OpenOptions;

use std::io::{self, Write};
use std::path::PathBuf;
use tokio::task::JoinHandle;
use tokio::time::Duration;

use crate::libs::breaker::parser;

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



pub async fn breaker_on(file_name: String, path_file: PathBuf, jwt: String) {
    //parser::build_database();

    let mut file_data_blocks: parser::FileData = parser::FileData::default();
    
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
            

            breaker_send_files(chunk, &mut handlers, jwt.clone());
            join_all(handlers).await;  
            

            batch_num += 1;
        } 
    } else {
        println!("Arquivo não encontrado, tente novamente");
    }   
    
    //std::fs::remove_dir_all(format!("{}-blocks_holder", file_name)).expect("Erro ao tentar remover pasta");
}

pub fn breaker_send_files(files_to_send: Vec<String>, handlers: &mut Vec<JoinHandle<()>>, jwt: String) {
    
    for file in files_to_send {
            let handler = thread_send_file(file, jwt.clone());
            handlers.push(handler);
    }       
}

pub fn thread_send_file(file: String, jwt: String) -> JoinHandle<()> {

    #[cfg(target_os = "linux")]
    let path_files_thread = file.clone().split("/").collect::<Vec<&str>>()[1].to_string();
    
    #[cfg(target_os = "windows")]
    let path_files_thread = file.clone().split("\"").collect::<Vec<&str>>()[1].to_string();

    let handler = tokio::spawn(async move {              
        
        println!("{}", file);
        
        send_file(file, path_files_thread, jwt).await; 
    });

    
    handler
}

pub async fn send_file(file: String, path_files_thread: String, jwt: String) {
    //let result_sender = bot_thread.send_document(chat_id, InputFile::file(file.clone())).await;
    let client = reqwest::Client::new();

    let form = reqwest::multipart::Form::new()
        .file(file.clone(), file.clone())
        .await.unwrap();

    let json = HashMap::new();

    json.insert("originalFileName", 10);
    json.insert("originalSize", 10);
    json.insert("blocksCount", 10);
    json.insert("index", 10);
    json.insert("blockName", file.clone());
    

    let res = client.post("http://localhost:3000/api/send_block")
        .multipart(form)
        .header("authorization", format!("Bearer {}", jwt))
        .json(&json)
        .send()
        .await;

    if res.is_err(){
        eprint!("Erro: {}", res.err().unwrap());
        return;
    }

    let data = res.unwrap();

    if data.status().is_success() {
        std::fs::remove_file(file.clone()).expect("Arquivo não foi possivel remover");    
    } else {
        eprintln!("{}", data.status().as_u16());
    }
}