use axum::{Router, routing::get};
use turso::Builder;

async fn root() -> &'static str {
    "Hello, World"
}


/*
    no bot do telegram, devo escrever um /cadastrar, quando receber isso, o bot vai enviar
    um codigo gerado, esse codigo sera jogando aqui em create_account, vamos testar se e valido
    se for valido, vamos criar a conta do usuario no banco "Torso" com os dados do telegram. 
*/
async fn create_account() {

}

pub async fn api_on() {
    let db = Builder::new_local("users.db").build().await.expect("Não foi possivel abrir banco de dados");

    let conn = db.connect().expect("Não foi possivel conectar");

    let app = Router::new()
                .route("/", get(root));
                
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.expect("Erro ao tentar criar listener");
    axum::serve(listener, app).await.expect("Erro ao tentar criar axum server");
}
