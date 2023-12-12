
import mysql from 'mysql2'

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '10501',
    database: 'testbase'
}).promise()
  
export async function getData(request, requestSpecifier, id, editMode){
    let query;
    switch(request){
    case 'timeTable':
        switch(requestSpecifier){
        case 'students':
            query = `
            SELECT 
                MAX(daysoftheweek.day_id) AS dayNum,
                MAX(timeTable.week_type_id) AS weekType,
                MAX(classTimeTable.class_start) AS startTime,
                MAX(classes.name) AS class,
                MAX(classes.class_type) AS classType,
                MAX(rooms.room_num) AS roomNum,
                MAX(addresses.address) AS address,
                MAX(addresses.link) AS URL,
                GROUP_CONCAT(DISTINCT CONCAT_WS(' ',teachers.surname, teachers.name_s, teachers.patronymic_s) SEPARATOR ', ') AS teacher
            FROM
                timeTable
                    INNER JOIN
                classTimeTable ON timeTable.time_id = classTimeTable.time_id
                    INNER JOIN
                classes ON timeTable.class_id = classes.class_id
                    INNER JOIN
                teachers ON timeTable.teacher_id = teachers.teacher_id
                    INNER JOIN
                studentGroups ON timeTable.group_id = studentGroups.group_id
                    INNER JOIN
                rooms ON timeTable.room_id = rooms.room_id
                    INNER JOIN
                addresses ON timeTable.address_id = addresses.address_id
                    INNER JOIN
                daysoftheweek ON timeTable.day_id = daysoftheweek.day_id
            WHERE studentGroups.group_num = ?
            GROUP BY studentGroups.group_id, daysoftheweek.day_id , timeTable.week_type_id , classTimeTable.class_start, rooms.room_id, classes.class_id;
            `;
            break;
        case 'teachers':
            query = `
            SELECT 
            MAX(daysoftheweek.day_id) AS dayNum,
            MAX(timeTable.week_type_id) AS weekType,
            MAX(classTimeTable.class_start) AS startTime,
            MAX(classes.name) AS class,
            MAX(classes.class_type) AS classType,
            GROUP_CONCAT(DISTINCT studentGroups.group_num SEPARATOR ', ') AS groupNum,
            MAX(addresses.address) AS address,
            MAX(addresses.link) AS URL,
            MAX(rooms.room_num) AS roomNum
        FROM
            timeTable
                INNER JOIN
            classTimeTable ON timeTable.time_id = classTimeTable.time_id
                INNER JOIN
            classes ON timeTable.class_id = classes.class_id
                INNER JOIN
            teachers ON timeTable.teacher_id = teachers.teacher_id
                INNER JOIN
            studentGroups ON timeTable.group_id = studentGroups.group_id
                INNER JOIN
            rooms ON timeTable.room_id = rooms.room_id
                INNER JOIN
            addresses ON timeTable.address_id = addresses.address_id
                INNER JOIN
            daysoftheweek ON timeTable.day_id = daysoftheweek.day_id
        WHERE teachers.teacher_id = ?
        GROUP BY teachers.teacher_id , daysoftheweek.day_id , timeTable.week_type_id , classTimeTable.class_start, rooms.room_id, classes.class_id;
      `;
            break;
        case 'rooms':
            query = `
            SELECT 
                MAX(daysoftheweek.day_id) AS dayNum,
                MAX(timeTable.week_type_id) AS weekType,
                MAX(classTimeTable.class_start) AS startTime,
                MAX(classes.name) AS class,
                MAX(classes.class_type) AS classType,
                GROUP_CONCAT(DISTINCT studentGroups.group_num SEPARATOR ', ') AS groupNum,
                MAX(addresses.address) AS address,
                MAX(addresses.link) AS URL,
                GROUP_CONCAT(DISTINCT CONCAT_WS(' ',teachers.surname, teachers.name_s, teachers.patronymic_s) SEPARATOR ', ') AS teacher
            FROM
                timeTable
                    INNER JOIN
                classTimeTable ON timeTable.time_id = classTimeTable.time_id
                    INNER JOIN
                classes ON timeTable.class_id = classes.class_id
                    INNER JOIN
                teachers ON timeTable.teacher_id = teachers.teacher_id
                    INNER JOIN
                studentGroups ON timeTable.group_id = studentGroups.group_id
                    INNER JOIN
                addresses ON timeTable.address_id = addresses.address_id
                    INNER JOIN
                rooms ON timeTable.room_id = rooms.room_id
                    INNER JOIN
                daysoftheweek ON timeTable.day_id = daysoftheweek.day_id
            WHERE rooms.room_num = ?
            GROUP BY classTimeTable.time_id, daysoftheweek.day_id, timeTable.week_type_id, classTimeTable.class_start, classes.class_id;
            `
            break;      
        }
        break;
    case 'groups':
            query = `
            SELECT *  FROM studentGroups ORDER BY group_id;
            `;
        break;
    case 'teachers':
        if(!editMode){
            query = `
            SELECT teacher_id, CONCAT_WS(' ',teachers.surname, teachers.name_s, teachers.patronymic_s) AS name FROM teachers ;
            `;
        }else{
            query = `
            SELECT teacher_id, teachers.surname, teachers.name, teachers.patronymic FROM teachers ORDER BY teacher_id;
            `;
        }
        break;
    case  'rooms':
        query = `
        SELECT * FROM rooms ORDER BY room_id;
        `;
        break;
    case 'classes':
        query = `
        SELECT * FROM classes ORDER BY class_id;
        `;
        
        break;
    default:
        console.log(`wrong request: ${request}`);
        return;
    }
    const [rows] = await pool.query(query, [id], function (err, result, fields){
        if(err){
            console.log(err);
        }
        else{
            console.log(result);
        }
        //console.log(result);
    });
    //console.log(rows);
    return rows;
}

export async function sendData(data) {
    let query;
    //console.log(data);
    switch(data.action){
        case 'add':
            query = `INSERT INTO ?? VALUES (?)`;
            pool.query(query, [data.destination, data.parsel]);
        break;
        case 'edit':
            let set = '';
            let paramArr = [];

            paramArr.push(data.parsel[0].paramName);

            data.parsel.slice(2).forEach(element => {
                set += '?? = ?, ';
                paramArr.push(element.paramName, element.paramValue);
            });
            set = set.slice(0, -2);

            query = `UPDATE ?? SET `+ set + ` WHERE ?? = ? `;

            paramArr.push(data.parsel[1].paramName, data.parsel[1].paramValue);
            
            pool.query(query, paramArr);
            break;
        case 'delete':
            let id = data.parsel[0];
            query = `DELETE FROM ?? WHERE ?? = ?`;
            pool.query(query, [data.destination, id, data.parsel[1]]);
        break;
    }
    //console.log(query);
}
