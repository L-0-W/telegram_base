mod api;
mod  bot;
mod parser;
mod tray;

#[tokio::main]
async fn main() -> () {
   // bot::bot_on().await
   // api::api_on().await

   tray::build();
}

