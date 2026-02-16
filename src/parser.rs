use std::io::{BufRead, BufReader, BufWriter, Write};
use std::fs::File;
use std::fs::create_dir;
use std::fs::OpenOptions;

use memmap2::MmapOptions;

use crate::parser;

#[derive(Clone)]
pub struct MemoryBlock {
    ids: Vec<String>,
    names: Vec<String>
}

#[derive(Clone, Default)]
pub struct FileData {
    file_name: Option<String>,
    total_lines: Option<String>,
    initial_line: Option<String>,
    memory_blocks: Option<MemoryBlock>,
}

impl FileData {
    pub fn set_file_name(&mut self, file_name: String) {
        self.file_name = Some(file_name)
    }

    pub fn set_total_lines(&mut self, total_lines: usize) {
        self.total_lines = Some(total_lines.to_string())
    }

    pub fn set_initial_line(&mut self, initial_line: String) {
        self.initial_line = Some(initial_line)
    }

    pub fn set_memory_blocks(&mut self, memory_blocks: MemoryBlock) {
        self.memory_blocks = Some(memory_blocks)
    }

    pub fn get_memory_blocks_ids(&self) -> Vec<String> {
        return self.memory_blocks.as_ref().expect("erro").ids.clone()
    }

    pub fn get_memory_blocks_names(&self) -> Vec<String> {
        return self.memory_blocks.as_ref().expect("erro").names.clone()
    }

    pub fn get_name(&self) -> String {
        return self.file_name.clone().expect("msg")
    }


    pub fn get_total_lines(&self) -> String {
        return self.total_lines.clone().expect("erro")
    }

    pub fn get_total_lines_as_number(&self) -> u16 {
        let total_lines: u16 = self.total_lines.clone().expect("erro").parse().expect("err");
        return total_lines
    }


    pub fn get_initial_line(&self) -> String {
        return self.initial_line.clone().expect("erro")
    }
}

pub fn break_file(file_name: &str, path: &str, file_data_block: &mut FileData)  {
    let file = File::open(path).expect("Não foi possivel achar video");

    let mmap = unsafe {
        MmapOptions::new()
            .map(&file)
            .expect("Não foi possivel carregar video na memoria")
    };

    let original_file_size_in_mb = &mmap.len() / 1_000_000;
    let original_file_size_in_bytes = &mmap.len();

    println!("Tamanho total arquivo em MB: {} \n Tamanho total arquivo em BYTES: {}", original_file_size_in_mb, original_file_size_in_bytes);

    let mut bytes_20 = 20_000_000;

    let mb_10 = bytes_20 / 1_000_000;
    let mut offset = 0;

    let loop_iterations = original_file_size_in_mb / mb_10;

    println!("Numero de iterações: {}", loop_iterations);

    let folder_name = format!("./{}-blocks_holder", file_name);
    let _ = create_dir(folder_name.as_str()).expect("Não foi possivel criar diretorio");

    if loop_iterations <= 0 {
        if let Ok(new_file_block_memory) = File::create_new(format!("{}/{}_block_memory-{}", folder_name.as_str(), file_name.split_whitespace().collect::<String>(), 0)) {
            println!("> FILE CREATED");
            
            let mut writter = BufWriter::with_capacity(1024 * 1024, new_file_block_memory);
            writter.write_all(&mmap).expect("Não foi possivel escrever em arquivo");
            
            writter.flush().expect("erro ao dar flush");
            
            println!("> FILE WRITTEN");
        }

        println!("NAME FILE: {}", file_name.split_whitespace().collect::<String>());
        file_data_block.set_file_name(file_name.split_whitespace().collect::<String>());
        file_data_block.set_total_lines(1);
        return;
    }

    let mut idx = 0;
    loop {
        println!("------------------------------------------");
        println!("Index: {}", idx);
        println!("> BLOCO EM BYTES: {}", bytes_20);

        if idx >= loop_iterations {
            break;
        }

        let memory_bloco: &[u8] = &mmap[offset..bytes_20];

        println!("Tamanho total bloco em MB: {}", memory_bloco.len() / 1_000_000);

        if let Ok(new_file_block_memory) = File::create_new(format!("{}/{}_block_memory-{}", folder_name.as_str(), file_name.split_whitespace().collect::<String>(), idx)) {
            println!("> FILE CREATED");

            let mut writter = BufWriter::with_capacity(1024 * 1024, new_file_block_memory);
            writter.write_all(memory_bloco).expect("Não foi possivel escrever em arquivo");

            writter.flush().expect("erro ao dar flush");

            println!("> FILE WRITTEN");
        }


        println!("------------------------------------------");

        offset += 20_000_000;
        bytes_20 += 20_000_000;        
        idx += 1;
    }

     println!("NAME FILE: {}", file_name.split_whitespace().collect::<String>());
    file_data_block.set_file_name(file_name.split_whitespace().collect::<String>());
    file_data_block.set_total_lines(loop_iterations);
}


pub fn list_files(file_name: String) -> Vec<String> {
    let format_path = format!("{}-blocks_holder", file_name);
    let files_string: Vec<String> = std::fs::read_dir(format_path).expect("Não foi possivel").map(|dir|  
        dir.expect("").path().into_os_string().into_string().unwrap().as_str().to_string()
    ).collect();

    return files_string;
}

pub fn delete_file_prefix() {
    let _ = std::fs::read_dir("./data").expect("Não foi possivel ler pasta").for_each(|dir| 
        {
           let file_path = dir.expect("").path().into_os_string().into_string().unwrap();
            
           if file_path.contains("_block_memory") {
                std::fs::remove_file(file_path).expect("Arquivo não encontrado");
           }

        });
}

pub fn filter_long_string(str: String) -> String {

    if str.len() > 25 { 
        let mut return_name = str
            .chars()
            .collect::<Vec<char>>()[0..25]
            .iter().collect::<String>(); 
        
        return_name.push_str("...");
        return_name 
    } else { str }
}

pub fn get_stored_files() -> Vec<String> {
    let file = File::open("./database/data.index").expect("Não foi possivel abrir arquivo");

    let mmap = unsafe { 
        MmapOptions::new().map(&file).expect("Não foi possivel carregar com mmap")
    };


    let index = String::from_utf8_lossy(&mmap);
    
    let value_vec = index.split('\n')
        .collect::<Vec<&str>>()
        .iter().map(|name| name.split("|").next().expect("").to_string())
        .collect::<Vec<String>>();


    value_vec
}

pub fn get_file_blocks(file_name: String, file_data_blocks: &mut FileData) {
    let file = File::open("./database/data.index").expect("Não foi possivel abrir arquivo");

    let mmap = unsafe { 
        MmapOptions::new().map(&file).expect("Não foi possivel carregar com mmap")
    };

    println!("{}", file_name);

    let index = String::from_utf8_lossy(&mmap);
    let mut value_res = index.split('\n')
        .collect::<Vec<&str>>()
        .into_iter()
        .filter(
            |line| line.split('|').collect::<Vec<&str>>()[0] == file_name
        );

    
        
    if let Some(value) = value_res.next() {
        println!("{}", value);

        let values_vec = value.split('|').collect::<Vec<&str>>();

        let (offset, size) = (values_vec[1].parse::<usize>(), values_vec[2].parse::<usize>().expect("a"));

        println!("Começando a pegar Ids..");

        let (ids, names) = crate::parser::get_blocks_id(offset.expect("erro ao converter &str to usize"), size);
    
        let mem_block = MemoryBlock { ids: ids, names: names };
        
        file_data_blocks.set_memory_blocks(mem_block);
        //FileData::new(file_name, size.clone() as u16, Some(mem_block))
        
    } else {
        println!("Arquivo não foi encontrado");
    }
}


pub fn get_blocks_id(mut offset: usize, size: usize) -> (Vec<String>, Vec<String>){
    let file = File::open("./database/data.block").expect("Não foi possivel abrir arquivo");
    let reader = BufReader::new(&file);

    let mut ids = Vec::new();
    let mut names = Vec::new();

    offset = if offset > 0 { offset-1 } else { offset };

    for (idx, linha) in reader.lines().skip(offset).enumerate() {
        println!("enter: {} - {} - {}", idx, offset, size);

        if size < offset {
            if idx > size {
                break;
            }
        } else if size >= offset {
            if idx > size {
                break;
            }
        }
            
        let linha_ok = linha.expect("a");

        println!("{} - {}", idx, linha_ok);

        let block_id = linha_ok.split('|').map(|line| line.to_string()).collect::<Vec<String>>()[0].clone();
        let block_name = linha_ok.split('|').map(|line| line.to_string()).collect::<Vec<String>>()[1].clone();
     
        ids.push(block_id);
        names.push(block_name);
    };

    (ids, names)
}


pub fn rebuild_blocks(file_data: &FileData) {
    println!("Nome: {}, Tamanh: {}", file_data.clone().get_name(), file_data.get_total_lines());

    let mut file_to_build = OpenOptions::new()
        .create(true)
        .append(true)
        .open(format!("./data/{}", file_data.clone().get_name())).expect("Não foi possivel escreve em arquivo de ids");
    
    
        
    let mut index = 0;
    loop {

        if index >= file_data.get_total_lines_as_number() {
            break;
        }

        let path = format!("./data/{}_block_memory-{}", file_data.get_name().split_whitespace().collect::<String>(), index);
        println!("file index: {}", path);


        let file_bytes = std::fs::read(path).expect("teste");


        file_to_build.write_all(&file_bytes).expect("a");
        
        index+=1;
    }

    parser::delete_file_prefix();
}


pub fn get_next_index() -> String {
    let content = std::fs::read_to_string("./database/data.index").expect("erro");


    if let Some(last_line) = content.lines().last() {
        let split_last_line = last_line.split('|').collect::<Vec<&str>>();
        
        let last_index = split_last_line[2].parse::<u16>().expect("msg");
        let offset_of_last_index = split_last_line[1].parse::<u16>().expect("msg");

        let next_index = last_index + offset_of_last_index;


        println!("Ultima linha: {}", next_index);

        next_index.to_string()
    } else {
        println!("Arquivo vazio!, retornando 0");
        0.to_string()
    }
}


pub fn build_file_data(file_name: String, file_data: &mut FileData) {
    let file = File::open("./database/data.index").expect("Não foi possivel abrir arquivo");

    let mmap = unsafe { 
        MmapOptions::new().map(&file).expect("Não foi possivel carregar com mmap")
    };


    let index = String::from_utf8_lossy(&mmap);
    let mut value_res = index.split('\n')
        .collect::<Vec<&str>>()
        .into_iter()
        .filter(
            |line| line.split('|').collect::<Vec<&str>>()[0] == file_name
        );

    
        
    if let Some(value) = value_res.next() {
        println!("{}", value);

        let values_vec = value.split('|').collect::<Vec<&str>>();

        file_data.set_file_name(values_vec[0].to_string());
        file_data.set_initial_line(values_vec[1].to_string());
        file_data.set_total_lines(values_vec[2].to_string().parse::<usize>().expect("abc"));
        
    } else {
        println!("Arquivo não foi encontrado");
    }
}

pub fn build_database() {
    let exist = std::fs::exists("./database").expect("Não foi possivel saber se a pasta existe");
        
        
    if !exist {
        std::fs::create_dir("./database").expect("Erro ao tentar criar pasta database");
        
        let _ = File::create("./database/data.block").expect("Não foi possivel criar data.block");
        let _ = File::create("./database/data.index").expect("Não foi possivel criar data.index");

    }
}

