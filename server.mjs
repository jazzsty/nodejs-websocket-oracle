import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import oracledb from 'oracledb';
import path from 'path';
import dbconfig from './dbconfig.js'; // DB 설정 파일
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// index.html 파일 제공
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Oracle DB에 메시지 저장 함수
async function saveMessageToDB(message) {
    let conn;
    try {
        conn = await oracledb.getConnection(dbconfig);
        console.log("Oracle DB 연결 성공!");

        // 메시지를 저장하는 SQL 실행
        const sql = "INSERT INTO chat_log (message, created_at) VALUES (:message, SYSDATE)";
        const result = await conn.execute(sql, { message }, { autoCommit: true });

        console.log(`${result.rowsAffected}개의 행이 입력되었습니다.`);
    } catch (err) {
        console.error("DB 저장 중 에러 발생: ", err);
    } finally {
        if (conn) {
            try {
                await conn.close();
                console.log("DB 연결 해제 완료");
            } catch (err) {
                console.error("DB 해제 중 에러: ", err);
            }
        }
    }
}

// 소켓 연결 처리
io.on('connection', (socket) => {
    console.log('클라이언트가 연결되었습니다.');

    // 클라이언트로부터 메시지를 수신
    socket.on('chat message', async (msg) => {
        console.log('사용자가 보낸 메시지: ' + msg);

        // DB에 메시지 저장
        await saveMessageToDB(msg);

        // 클라이언트에게 응답 전송
        socket.emit('chat message', '서버가 보낸 메시지: 저장 완료');
    });

    // 클라이언트 연결 해제 처리
    socket.on('disconnect', () => {
        console.log('클라이언트와의 연결이 종료되었습니다.');
    });
});

// 서버 실행
server.listen(8080, () => {
    console.log('서버가 8080 포트에서 실행 중입니다.');
});
