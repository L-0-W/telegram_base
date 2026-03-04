use reqwest;
use serde::Deserialize;
use std::{collections::HashMap, path::PathBuf};

use crate::modules;

#[derive(Deserialize)]
struct LoginRes {
    success: bool,
    token: String,
    #[allow(unused)]
    message: String,
}

#[derive(Deserialize, serde::Serialize)]
pub struct File {
    pub fileName: String,
    pub originalSize: u8,
    pub blocksCount: u16,
}

#[tauri::command]
pub async fn login(email: String, password: String) -> Option<String> {
    let client = reqwest::Client::new();

    let mut map = HashMap::new();

    map.insert("email", email);
    map.insert("password", password);

    let res = client
        .post("http://localhost:3000/api/login")
        .json(&map)
        .send()
        .await;

    if let Ok(data) = res {
        if data.status().is_success() {
            let login_res = data.json::<LoginRes>().await.expect("erro ao receber json");

            if login_res.success {
                return Some(login_res.token);
            }
        }
    }

    None
}

#[tauri::command]
pub async fn login_jwt(jwt: String) -> bool {
    println!("ABC");
    let client = reqwest::Client::new();

   
    let res = client
        .post("http://localhost:3000/api/login-jwt")
        .json(&[jwt])
        .send()
        .await;

    if let Ok(data) = res {
        if data.status().is_success() {
            return true;
        };
    }

    false
}

#[tauri::command]
pub async fn get_files(jwt: String) -> Option<Vec<File>> {
    let client = reqwest::Client::new();

    let res = client.get("http://localhost:3000/api/get-files")
        .header("authorization", format!("Bearer {}", jwt))
        .send()
        .await;

    if let Ok(data) = res {
        let json_res = data.json::<Vec<File>>().await;

        if json_res.is_err() {
            eprintln!("{}", json_res.err().unwrap());
            return None;
        };
        
        let files: Vec<File> = json_res.unwrap();

        return Some(files);
    }

    None

}

#[tauri::command]
pub async fn handle_drop(file_name: String, file_path: String, id: u8, jwt: String) -> bool {
    if id != 1 {
        return false;
    }

    println!("PQ ISSO E CHAMADO 2 VEZESSSSSSSSSSSSSSSSS");
    modules::FileManager::maneger::breaker_on(file_name, PathBuf::from(file_path), jwt).await;

    true
}