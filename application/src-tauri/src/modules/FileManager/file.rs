use std::{fs::create_dir, io::{BufWriter, Write}, path::Path};

use memmap2::MmapOptions;

struct Blocks {
    count: u32,
    names: Vec<String>,
    paths: Vec<String>
}

struct File {
    path: String,
    name: String,
    size_in_bytes: u64,
    size_in_mb: u16,
    size_in_gb: u8,
    os_file: std::fs::File
}

impl Blocks {
    pub fn new() -> Self {
        Self { count: 0, names: Vec::new(), paths: Vec::new() }
    }

    pub fn update_count(&mut self, count: u32) {
        self.count = count;
    }

    pub fn add_block(&mut self, name: String, path: String) {
       self.names.push(name);
       self.paths.push(path);
    }

    pub fn add_blocks(&mut self, names: Vec<String>, paths: Vec<String>) {
        self.names.extend(names);
        self.paths.extend(paths);
    }
}


impl File {

    pub fn open(path: &str, name: &str) -> Option<Self> {


        if Path::exists(Path::new(path)) {
            eprintln!("Não foi possivel achar caminho");
            return None;
        }

        let file = std::fs::File::open(path).expect("erro, arquivo não encontrado");

        let full_path_os = std::fs::canonicalize(path);

        if full_path_os.is_err() {
            return None
        }

        let full_path_os_un = full_path_os.unwrap(); 
        let full_path_str = full_path_os_un.to_str();

        if full_path_str.is_none() {
            return None;
        }

        let file_metadata = file.metadata();

        if file_metadata.is_err() {
            return None;
        }

        let file_len_bytes: u64 = file_metadata.unwrap().len();
        let file_len_mb: u16 = (file_len_bytes * 1024 * 1024) as u16;
        let file_len_gb: u8 = if file_len_mb * 1024 <= 0 { 0 } else { (file_len_mb * 1024) as u8 };
        
        Some(Self {
            path: format!("{}", full_path_str.unwrap()),
            name: name.to_string(),
            size_in_bytes: file_len_bytes,
            size_in_mb: file_len_mb,
            size_in_gb: file_len_gb,
            os_file: file,
        })
    }


    fn break_file(&self, file_data_block: &mut Blocks) -> Option<()>  {        
        let mmap = unsafe {
            MmapOptions::new()
            .map(&self.os_file)
            .expect("Não foi possivel carregar arquivo na memoria")
        };
        
        
        println!("Tamanho total arquivo em MB: {} \n Tamanho total arquivo em BYTES: {}", &self.size_in_mb, &self.size_in_bytes);
        
        let twenty_million_in_bytes  = 20_000_000;
        let mut twenty_in_megabytes  = twenty_million_in_bytes / 1_000_000;
        let mut offset = 0;
        
        let loop_iterations = &self.size_in_mb / twenty_in_megabytes;

        file_data_block.update_count((loop_iterations+1) as u32);
        
        println!("Numero de iterações: {}", loop_iterations);
        
        let folder_of_blocks_name = format!("{}-blocks_holder", &self.name);
        let _ = create_dir(folder_of_blocks_name.as_str()).expect("Não foi possivel criar diretorio");
        
        if loop_iterations <= 0 {
            let file_name = format!("{}/{}_block_memory-{}", folder_of_blocks_name.as_str(), &self.name.split_whitespace().collect::<String>(), 0);
            let file_path = std::fs::canonicalize(&file_name).unwrap().to_str().unwrap().to_string();
            
            if let Ok(new_file_block_memory) = std::fs::File::create_new(&file_name) {
                println!("> FILE CREATED");
                
                let mut writter = BufWriter::with_capacity(1024 * 1024, new_file_block_memory);
                writter.write_all(&mmap).expect("Não foi possivel escrever em arquivo");
                
                writter.flush().expect("erro ao dar flush");
                
                println!("> FILE WRITTEN");
            
                println!("NAME FILE: {}", &file_name);
                file_data_block.add_block(file_name, file_path);
            }
            
            return Some(());
        }
        
        let mut idx = 0;

        let mut file_names: Vec<String> = Vec::new();
        let mut file_paths: Vec<String> = Vec::new();

        loop {
            println!("------------------------------------------");
            println!("Index: {}", idx);
            println!("> BLOCO EM BYTES: {}", twenty_in_megabytes);
            
            if idx >= loop_iterations {
                break;
            }
            
            let memory_bloco: &[u8] = &mmap[offset..twenty_in_megabytes as usize];
            
            println!("Tamanho total bloco em MB: {}", memory_bloco.len() / 1_000_000);
            
            let file_name = format!("{}/{}_block_memory-{}", folder_of_blocks_name.as_str(), &self.name.split_whitespace().collect::<String>(), idx);
            let file_path = std::fs::canonicalize(&file_name).unwrap().to_str().unwrap().to_string();
            
            if let Ok(new_file_block_memory) = std::fs::File::create_new(&file_name) {
                println!("> FILE CREATED");
                
                let mut writter = BufWriter::with_capacity(1024 * 1024, new_file_block_memory);
                writter.write_all(memory_bloco).expect("Não foi possivel escrever em arquivo");
                
                writter.flush().expect("erro ao dar flush");
                
                println!("> FILE WRITTEN");
            }
            
            
            println!("------------------------------------------");
            
            file_names.push(file_name);
            file_paths.push(file_path);

            offset += 20_000_000;
            twenty_in_megabytes += 20_000_000;        
            idx += 1;
        }
        
        file_data_block.add_blocks(file_names, file_paths);
        
        return Some(());
    }

}