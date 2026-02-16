

#[cfg(target_os = "linux")]
use gtk::glib;


use image::GenericImageView;
use tao::event_loop::EventLoop;
use tao::window::WindowBuilder;
use tokio::runtime::Runtime;
use tray_icon::menu::{MenuEvent, MenuItem, Submenu};
use tray_icon::{Icon, TrayIconBuilder};


use tray_icon::{menu::Menu};
use std::path::{Path, PathBuf};

use crate::{bot, parser};

fn load_image(path: &Path) -> Icon {
    let img = image::open(Path::new(path)).expect("nao foi possivel abrir image");
    let img_as_rgb8 = img.clone().into_rgba8();

    let colors_vec = img_as_rgb8.to_ascii_lowercase();

    let (width, height) = img.dimensions();

    let icon = Icon::from_rgba(colors_vec, width, height);

    icon.expect("nao foi possivel criar icone")
}

fn show_os() {
    if cfg!(target_os = "linux") {
        println!("Abiente linux");
    } else if cfg!(target_os = "windows"){
        println!("Ambiente windows");
    } else {
        println!("Ambiente não conhecido")
    }
}

struct FileName {
    id: String,
    name: String,
}

pub async fn build(){

    show_os();

    let event_loop = EventLoop::new();

    let _window = WindowBuilder::new()
        .with_title("title")
        .with_visible(false)
        .build(&event_loop)
        .unwrap();

    let tray_menu = Menu::new();

    let menu_item_watch = MenuItem::new("Watch Folder", true, None);
    let menu_item_select = MenuItem::new("Select Files", true, None);
    
    let submenu_items_download = Submenu::new("Files", true);

    tray_menu.append(&menu_item_watch).unwrap();
    tray_menu.append(&menu_item_select).unwrap();
    tray_menu.append(&submenu_items_download).unwrap();

    let mut file_names_stored: Vec<FileName> = Vec::new();

    if std::fs::exists("./data/data.index").expect("Não foi possivel fazer pesquisa por pasta") {
        for file_name in parser::get_stored_files() {

            if file_name.is_empty() {
                continue;
            }

            let filtered_str = parser::filter_long_string(file_name.clone());
            let item_files = MenuItem::new(filtered_str, true, None);

            file_names_stored.push(FileName { id: item_files.id().0.clone(), name: file_name });

            submenu_items_download.append(&item_files).unwrap();
        }
    }

    let icon= load_image(Path::new("./res/images.png"));
        
    let _tt = TrayIconBuilder::new()
        .with_menu(Box::new(tray_menu))
        .with_tooltip("system-tray - tray icon library!")
        .with_icon(icon)
        .build()
        .unwrap();



    let rt = Runtime::new().expect("Não foi possivel abrir runtime");

    event_loop.run( move |_, _, _| {
        if let Ok(event) = MenuEvent::receiver().try_recv() {
            use rfd::FileDialog;
            
            println!("{:?}", event);
            if event.id.0 == menu_item_watch.id().0 {
                
                let file_option = FileDialog::new()
                .set_directory("~")
                .pick_folder();
                
                if file_option.is_none() {
                    return;
                }
                
                let file = file_option.unwrap();
                
                println!("{}", file.to_str().expect(""));
            }
            
            if event.id.0 == menu_item_select.id().0 {
                let files_option: Option<Vec<std::path::PathBuf>> = FileDialog::new()
                .set_directory("~")
                .pick_files();     
                
                if files_option.is_none() {
                    return;
                }

                let paths = files_option.expect("path bufs");
                
                for path in paths {
                    println!("{}", path.to_str().expect(""));
                    
                    let file_name = path.file_name().expect("").to_str().expect("");
                    
                    
                    rt.spawn(spawn_sync_task(file_name.to_string(), path, 2));
                }               
            }
            
            let file_names_stored_glib = &file_names_stored;
            for file_stored in file_names_stored_glib {
                if event.id.0 == file_stored.id {
                    rt.spawn(spawn_sync_task(file_stored.name.clone(), PathBuf::new(), 1));
                }
            }
        };
    });

}

async fn spawn_sync_task(file_name: String, path_file: PathBuf, choice: u8) {
    bot::bot_on(file_name, path_file, choice).await;
}
