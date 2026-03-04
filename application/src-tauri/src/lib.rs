mod commands; 
mod modules;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::login_jwt,
            commands::get_files,
            commands::handle_drop
        ])
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Criar itens do menu
            let quit_i = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let close_i = MenuItem::with_id(app, "toggle", "Toggle", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&quit_i, &close_i])?;

            let app_icon = app.default_window_icon();
            println!("Icone existe: {}", app_icon.is_some());

            // Build tray icon SEM o menu no builder
            let _tray = TrayIconBuilder::new()
                .icon(app_icon.unwrap().clone())
                .menu(&menu)
                .build(app)?;

            // Guardar menu no estado do app para usar nos handlers
            app.manage(menu);

            let main_window = app.get_webview_window("main").unwrap();

            let _ = main_window.hide();

            Ok(())
        })
        .on_menu_event(|app, event| {
            println!("a");
            match event.id.as_ref() {
                "quit" => {
                    println!("Sair selecionado");
                    app.exit(0);
                }
                "toggle" => {
                    // Check if window already exists
                    if let Some(window) = app.get_webview_window("tray-window") {
                        // Toggle visibility if window exists
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let pos: PhysicalPosition<f64> = app.cursor_position().unwrap();

                            // Move to current tray position and show
                            let _ = window.set_position(PhysicalPosition::new(pos.x, pos.y - 90.0));
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    } else {
                        println!("ENTER ELSE");
                        // Create new window positioned at tray
                        let window = WebviewWindowBuilder::new(
                            app,
                            "tray-window",
                            WebviewUrl::App("index.html".into()),
                        )
                        .inner_size(350.0, 500.0)
                        .decorations(false)
                        .always_on_top(true)
                        .skip_taskbar(true)
                        .focused(true)
                        .visible(false) // Start hidden to position first
                        .build();

                        if let Ok(window) = window {
                            // Position at tray center (above the icon)
                            let pos: PhysicalPosition<f64> = app.cursor_position().unwrap();

                            let _ = window.set_position(PhysicalPosition::new(pos.x, pos.y - 90.0));
                            let _ = window.show();
                            let _ = window.set_focus();

                            // Optional: Close window when it loses focus
                            // let window_clone = window.clone();
                            // window.on_window_event(move |event| {
                            //     if let tauri::WindowEvent::Focused(is_focused) = event {
                            //         if !is_focused {
                            //             let _ = window_clone.hide();
                            //         }
                            //     }
                            // });
                        }
                    }
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
