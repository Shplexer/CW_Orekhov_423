import mysql from 'mysql2'
import express from 'express';
import { getData, sendData } from './database.js';

const app = express();
const port = 8383;

app.use(express.static('public'));
app.use(express.json());


//Получение данных по URI из базы данных и отправка пользователю
app.get('/:request', async function (req, res){
    //Расшифровка параметров из 'GET' запроса для составления URI
    const request = req.params.request;
    if(!(request === 'favicon.ico')){
        console.log("GET: ", request);

        const id = req.query.id;
        const requestSpecifier = req.query.requestSpecifier;
        const editMode = (req.query.edit.toLowerCase() === "true");
        
        console.log("params: ", request, id, requestSpecifier, editMode);
        //отправка запроса к базе данных
        const data = await getData(request, requestSpecifier, id, editMode);
        //Возвраещение ответа API через статус HTTP в формате JSON
        res.status(200).json({info: data});
    }
}) 

//Отправка данных в базу данных
app.post('/', (req, res) => {
    //Расшифровка запроса для получения данных, которые необходимо отправить в СУБД
    const parsel = req.body.parsel;
    //console.log(parsel);
    if(!parsel){
        return res.status(400).send({status: 'failed'});
    }
    //Возвращение ответа в виде статуса, получены ли сервером данные
    res.status(200).send({status: 'recieved'});
    console.log("POST: ", parsel.action);
    //Отправка данных пользователя с запросом в базу данных
    sendData(parsel);
})

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '10501',
    database: 'testbase'
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.post('/auth', function(request, response) {
	let username = request.body.parsel.username;
	let password = request.body.parsel.password;
    console.log(request.body, username, password);
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				//response.redirect('/');
                response.status(200).json({status: true});
			} else {
				response.status(200).json({status: false});
			}			
			response.end();
		});
	} else {
		response.status(200).json({status: false});
		response.end();
	}
});


app.listen(port, () => console.log(`server launched on port: ${port}` ));