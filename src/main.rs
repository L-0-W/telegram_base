mod bot;
mod parser;

#[tokio::main]
async fn main() -> () {
//    parser::break_file();
    bot::bot_on().await;

    ()
}

