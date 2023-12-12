const baseUrl = "http://localhost:8383";
const date = new Date();

let globalTimetable = {
    obj: [],
    type: ''
};
let globalFilterType = `none`;

/**
 * Получает текущую дату и обновляет элементы HTML с датой и номером недели.
 */
function getDate() {
    // Рассчитываем дату начала года

    const startDate = new Date(date.getFullYear(), 0, 1);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Получаем название дня недели и месяца на русском языке
    const weekDay = date.toLocaleString('ru-ru', { weekday: 'long' });
    let monthWord = date.toLocaleString('ru-ru', { month: 'long' });
  
    // Форматируем название месяца в зависимости от его номера
    if (month == 3 || month == 8) {
      monthWord = monthWord + "a";
    } else {
        monthWord = monthWord.replace(/.$/,"я");
    }
    
    // Формируем полную дату
    const fullDate = `${day} ${monthWord} ${year}, ${weekDay}`;
    
    // Рассчитываем разницу в днях между текущей датой и началом года
    const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.ceil(daysDiff / 7);
    
    // Определяем, четная или нечетная неделя
    const result = (weekNumber % 2 == 0) ? "Четная" : "Нечетная";
  
    // Обновляем элементы HTML с датой и номером недели
    document.getElementById("date").innerHTML = fullDate;
    document.getElementById("week_num").innerHTML = `${result} неделя`;
  
    // Запускаем функцию снова через 1 секунду
    setTimeout(getDate, 1000);
}

/**
 * Устанавливает отображение текущей недели в пользовательском интерфейсе.
 */
function setWeek() {
    const tempDate = new Date(date);
    // Рассчитываем начало недели (воскресенье)
    let sunday = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay()));
    let week = [new Date(sunday)];
  
    // Добавляем остальные дни недели в массив
    while (sunday.setDate(sunday.getDate() + 1) && sunday.getDay() !== 0) {
      week.push(new Date(sunday));
    }
    week.shift();
  
    // Определяем идентификаторы элементов дней недели
    const daysOfTheWeekID = ['#monday', '#tuesday', '#wednesday', '#thursday', '#friday'];
  
    // Обновляем интерфейс для каждого дня недели
    for (let i = 0; i < daysOfTheWeekID.length; i++) {
      // Получаем месяц и форматируем его
      let month = week[i].getMonth() + 1;
      let monthWord = week[i].toLocaleString('ru-ru', { month: 'long' });
  
      // Добавляем дополнительный текст к monthWord в зависимости от месяца
      if (month == 3 || month == 8) {
        monthWord = monthWord + "a";
      } else {
        monthWord = monthWord.replace(/.$/, "я");
      }
  
      // Получаем день недели и форматируем его
      let weekDay = week[i].toLocaleString('ru-ru', { weekday: 'long' });
  
      // Получаем родительский элемент и обновляем дочерний элемент с отформатированной датой
      const parent = document.querySelector(daysOfTheWeekID[i]);
      const child = parent.querySelector('.week_day_name');
      child.innerHTML = `${weekDay.charAt(0).toUpperCase()}${weekDay.slice(1)}, ${week[i].getDate()} ${monthWord}`;
    }
  
    // Вызываем функцию снова после задержки в 1 секунду
    setTimeout(setWeek, 1000);
}
/**
 * Определяет текущее время и выделяет соответствующие учебные занятия на веб-странице.
 */
function determineCurrentTime(){
    const hours = date.getHours();
    let minutes = date.getMinutes();
    
    if(minutes < 10){
        minutes = `0${minutes}`;
    }
    const time = parseInt(`${hours}${minutes}`);
    const days = document.getElementsByClassName('week_day');
    for(let i = 0; i < days.length; i++){
        let weekDay = date.toLocaleString('ru-ru', { weekday: 'long' });
        weekDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
        if(days[i].innerHTML.includes(weekDay)){
            //console.log(days[i].innerHTML);
            for(let j = 0; j < days[i].getElementsByClassName('class_start').length; j++){
                let start = days[i].getElementsByClassName('class_start')[j];
                let end = days[i].getElementsByClassName('class_end')[j];
                //start.replace(/:/, '--');
                //end.replace(/:/, ' ');
                let tempStart = parseInt(`${start.innerHTML.replace(/:/, '')}`);
                let tempEnd = parseInt(`${end.innerHTML.replace(/:/, '')}`);
                
                if(tempStart <= time && time <= tempEnd){
                    start.style.fontWeight = 'bold';
                    end.style.fontWeight = 'bold';
                }
            }

        }
    }
    setTimeout(determineCurrentTime, 1000);
}
/**
 * Получает информацию из API на основе указанного запроса, спецификатора запроса и идентификатора.
 */
async function getInfo(isEdit, request, requestSpecifier, id) {
    // Строим URL API на основе запроса, спецификатора запроса и идентификатора
    const url = id ? 
        `${baseUrl}/${request}?requestSpecifier=${requestSpecifier}&id=${id}&edit=${isEdit}` :
        `${baseUrl}/${request}?edit=${isEdit}`;

    // Отправляем GET-запрос к API
    let res = await fetch(url, {
        method: 'GET'
    });

    // Получаем данные из ответа API
    const data = await res.json();

    // Обрабатываем полученные данные в зависимости от типа запроса
    switch(request) {
    case "rooms":
    case "teachers":
    case "groups":
    case "classes":
        if(!isEdit){
            filterChoice(data.info, request);
        }
        else{
            filterEdit(data.info, request);
        }
        break;
    case "timeTable":
        globalTimetable.obj = data.info;
        globalTimetable.type = requestSpecifier;
        setTimetable(globalTimetable.obj, globalTimetable.type);
        //console.log(data.info, requestSpecifier);
        break;
    }
}
/**
 * Отправляет информацию в API
 */
async function postInfo(action, rowContent, destination){
    //e.preventDefault();
    //Проверка на пустые входные данные
    if(rowContent == ''){  
        return
    }
    //Поиск и преобразование строковых чисел в обычные числа 
    rowContent = rowContent.map(content => isNaN(content) ? content : parseInt(content));

    let input = {
        parsel: rowContent,
        destination: destination,
        action: action
    };

    //Отправка данных в API через метод 'POST'
    const res = await fetch(baseUrl, 
    {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            parsel: input
        })
    })
}

function filterEdit(obj, filterType){
    const overlay = document.getElementById(`edit_list`);
    const searchBar = document.getElementById(`edit_search_bar`);
    overlay.innerHTML = '';

    let table = document.createElement('table'); 
    table.className = `edit_table`;
    table.id = `edit_table_id`;

    let thead = document.createElement('thead'); 
    let headerRow = document.createElement('tr');
    let tbody = document.createElement('tbody');

    let errorMessage = document.querySelector(".error_message");
    errorMessage.style.display = "none";
    document.getElementById('edit_list').style.marginTop = '29px';

    document.querySelector(`.add_button`).style.display = 'inline';
    let SQLTableName;
    let SQLRowId;
    let functionArgument;
    let setParams = [];

    for (let i = 0; i < obj.length; i++) {
        let row = document.createElement('tr');

        let editImg = document.createElement('img');
        let acceptImg = document.createElement('img');
        let cancelImg = document.createElement('img');
        let deleteImg = document.createElement('img');

        let editImgTableElement = document.createElement('td');

        editImgTableElement.appendChild(editImg);
        editImgTableElement.appendChild(acceptImg);
        editImgTableElement.appendChild(cancelImg);
        editImgTableElement.appendChild(deleteImg);

        editImg.src = "img/edit.png";
        acceptImg.src = "img/accept.png";
        cancelImg.src = "img/cancel.png";
        deleteImg.src = "img/delete.png";

        editImg.className = "table_control_icon edit_icon";
        acceptImg.className = "table_control_icon accept_icon";
        cancelImg.className =  "table_control_icon cancel_icon";
        deleteImg.className = "table_control_icon delete_icon";
        
        switch (filterType) {
        case `groups`:
            searchBar.placeholder = 'Группа...';
            document.getElementById("group_edit_button").className = `active_tab`;
            document.getElementById("teacher_edit_button").className = `inactive_tab`;
            document.getElementById("room_edit_button").className = `inactive_tab`;
            document.getElementById("class_edit_button").className = `inactive_tab`;
            
            if(i === 0){
                SQLTableName = `studentGroups`;
                SQLRowId = `group_id`;
                functionArgument = `groups`;

                let IDHeader = document.createElement('th'); 
                let groupHeader = document.createElement('th'); 

                IDHeader.textContent = "ID"; 
                groupHeader.textContent = "Группа"; 

                headerRow.appendChild(IDHeader); 
                headerRow.appendChild(groupHeader); 
                
                thead.appendChild(headerRow);
                
            }
            errorMessage.textContent = "Введенные данные должны содержать только цифры"; 

            let groupID = document.createElement('td');
            let groupNum = document.createElement('td');

            groupID.textContent = `${obj[i].group_id}`;
            groupNum.textContent = `${obj[i].group_num}`;

            row.appendChild(groupID);
            row.appendChild(groupNum);
            row.className = `group_row`;

            //li.addEventListener('click', editGroup());
            break;
        case `teachers`:
            searchBar.placeholder = 'Преподаватель...';
            document.getElementById("group_edit_button").className = `inactive_tab`;
            document.getElementById("teacher_edit_button").className = `active_tab`;
            document.getElementById("room_edit_button").className = `inactive_tab`;
            document.getElementById("class_edit_button").className = `inactive_tab`

            if(i === 0){
                SQLTableName = `teachers`;
                SQLRowId = `teacher_id`;
                functionArgument = `teachers`;

                let IDHeader = document.createElement('th'); 
                let surnameHeader = document.createElement('th'); 
                let nameHeader = document.createElement('th');
                let patronymicHeader = document.createElement('th'); 

                IDHeader.textContent = "ID"; 
                surnameHeader.textContent = "Фамилия"; 
                nameHeader.textContent = "Имя"; 
                patronymicHeader.textContent = "Отчество";

                headerRow.appendChild(IDHeader); 
                headerRow.appendChild(surnameHeader); 
                headerRow.appendChild(nameHeader); 
                headerRow.appendChild(patronymicHeader);
                
                thead.appendChild(headerRow); 
                 
            }
            errorMessage.textContent = "Введенные данные содержат недопустимые символы или длинна данных превышает 30 символов";
            
            let teacherID = document.createElement('td');
            let surname = document.createElement('td');
            let name = document.createElement('td');
            let patronymic = document.createElement('td');

            teacherID.textContent = `${obj[i].teacher_id}`;
            surname.textContent = `${obj[i].surname}`;
            name.textContent = `${obj[i].name}`;
            patronymic.textContent = `${obj[i].patronymic}`;

            row.appendChild(teacherID);
            row.appendChild(surname);
            row.appendChild(name);
            row.appendChild(patronymic);
            row.className = `teacher_row`;

            //li.addEventListener('click', () => editTeacher(li) );
            break;
        case `rooms`:
            searchBar.placeholder = 'Аудитория...';
            document.getElementById("group_edit_button").className = `inactive_tab`;
            document.getElementById("teacher_edit_button").className = `inactive_tab`;
            document.getElementById("room_edit_button").className = `active_tab`;
            document.getElementById("class_edit_button").className = `inactive_tab`

            if(i === 0){
                SQLTableName = `rooms`;
                SQLRowId = `room_id`;
                functionArgument = `rooms`;

                let IDHeader = document.createElement('th'); 
                let roomHeader = document.createElement('th'); 

                IDHeader.textContent = "ID"; 
                roomHeader.textContent = "Кабинет"; 

                headerRow.appendChild(IDHeader); 
                headerRow.appendChild(roomHeader); 
                
                thead.appendChild(headerRow); 
            }
            errorMessage.textContent = "Введенные данные должны содержать только цифры";
            
            let roomID = document.createElement('td');
            let roomNum = document.createElement('td');

            roomID.textContent = `${obj[i].room_id}`;
            roomNum.textContent = `${obj[i].room_num}`;

            row.appendChild(roomID);
            row.appendChild(roomNum);
            row.className = `room_row`;

            break;
        case `classes`:
            searchBar.placeholder = 'Дисциплины...';
            document.getElementById("group_edit_button").className = `inactive_tab`;
            document.getElementById("teacher_edit_button").className = `inactive_tab`;
            document.getElementById("room_edit_button").className = `inactive_tab`;
            document.getElementById("class_edit_button").className = `active_tab`;

            if(i === 0){
                SQLTableName = `classes`;
                SQLRowId = `class_id`;
                functionArgument = `classes`;

                let IDHeader = document.createElement('th');
                let classNameHeader = document.createElement('th');
                let classTypeHeader = document.createElement('th');

                IDHeader.textContent = "ID";
                classNameHeader.textContent = "Дисциплина";
                classTypeHeader.textContent = "Тип";

                headerRow.appendChild(IDHeader); 
                headerRow.appendChild(classNameHeader); 
                headerRow.appendChild(classTypeHeader);
                
                thead.appendChild(headerRow); 
            }
            errorMessage.textContent = "Введенные данные содержат недопустимые символы или длинна данных превышает допустимые значения";

            let classID = document.createElement('td');
            let className = document.createElement('td');
            let classType = document.createElement('td');

            classID.textContent = `${obj[i].class_id}`;
            className.textContent = `${obj[i].name}`;
            classType.textContent = `${obj[i].class_type}`;

            row.appendChild(classID);
            row.appendChild(className);
            row.appendChild(classType);

            row.className = `class_row`;

            break;
        }

        row.appendChild(editImgTableElement);
        tbody.appendChild(row);

        let rowContent = Array.from(row.querySelectorAll('td')).slice(1, -1);
        let uneditedRowContent = [];

        editImg.addEventListener('click', () => {
            let errFlag = false;
            let i = 0;
            console.log(rowContent);
            while(!errFlag && i < rowContent.length){
                errFlag = checkInput(rowContent[i]);
                console.log(errFlag, rowContent[i].textContent);
                i++;
            };
            if(errFlag){
                acceptImg.classList.add('inactive_icon');
            }
            if(editImg.classList.contains('inactive_icon')){
                this.removeEventListener('click', ()=> {
                    tableEditMode();
                });
            }
            else{
                tableEditMode();
            }
        })
        
        function tableEditMode(){
            //console.log(uneditedRowContent);
            tableClearAll();
            
            rowContent.forEach(element => { 
                uneditedRowContent.push(element.textContent);
                element.contentEditable = 'true';
                element.classList.add('editable_textbox');
                element.addEventListener("input", () => { checkInput(element); });
            });
            table.querySelectorAll('.edit_icon').forEach(element => { element.classList.add('inactive_icon'); });
            document.querySelector(`.add_button`).style.display = 'none';


            editImg.style.display = 'none';
            acceptImg.style.display = 'inline';
            cancelImg.style.display = 'inline';
        }
        deleteImg.addEventListener('click', () => {
            tableDeleteRow();
        })
        function tableDeleteRow(){
            console.log("deleted ",SQLRowId, row.cells[0].textContent, SQLTableName);
            postInfo(`delete`, [SQLRowId, row.cells[0].textContent], SQLTableName);
            setTimeout(() => {
                closeOverlay(`edit_overlay`);
                showOverlay(`edit_overlay`); 
                getInfo(true, functionArgument);
            }, 100);
        }

        acceptImg.addEventListener('click', () => {
            let errFlag = false;
            let i = 0;
            while(!errFlag && i < rowContent.length){
                errFlag = checkInput(rowContent[i]);
                console.log(errFlag, rowContent[i].textContent);
                i++;
            };
            if(errFlag){
                acceptImg.classList.add('inactive_icon');
            }
            if(acceptImg.classList.contains('inactive_icon')){
                alert('Введенные данные содержат недопустимые символы или длинна данных превышает допустимые значения');
                this.removeEventListener('click', ()=> {
                    tableSave();
                });
            }
            else{
                tableSave();
            }
        })
        function tableSave(){
            tableClearAll();

            let newRowContent = [];
            rowContent.forEach(element => {
                newRowContent.push(element.textContent);
            })
           // console.log("saved ", newRowContent);
            uneditedRowContent = newRowContent;
 
            editImg.style.display = 'inline';
            acceptImg.style.display = 'none';
            cancelImg.style.display = 'none';
            table.querySelectorAll('.edit_icon').forEach(element => { element.classList.remove('inactive_icon'); });
            document.querySelector(`.add_button`).style.display = 'inline';
        
            switch (SQLRowId){
                case `group_id`:
                    setParams = 
                    [
                        { paramName: SQLTableName},
                        { paramName: SQLRowId,      paramValue: row.cells[0].textContent },
                        { paramName: `group_num`,   paramValue: row.cells[1].textContent }
                    ];
                break;
                case `teacher_id`:
                    setParams = 
                    [
                        { paramName: SQLTableName},
                        { paramName: SQLRowId,      paramValue: row.cells[0].textContent },
                        { paramName: `surname`,     paramValue: row.cells[1].textContent },
                        { paramName: `name`,        paramValue: row.cells[2].textContent },
                        { paramName: `patronymic`,  paramValue: row.cells[3].textContent },
                        { paramName: `name_s`,      paramValue: row.cells[2].textContent.slice(0, 1).toUpperCase() + `.` },
                        { paramName: `patronymic_s`,paramValue: row.cells[3].textContent.slice(0, 1).toUpperCase() + `.` }
                    ];
                break;
                case `room_id`:
                    setParams = 
                    [
                        { paramName: SQLTableName},
                        { paramName: SQLRowId,      paramValue: row.cells[0].textContent },
                        { paramName: `room_num`,    paramValue: row.cells[1].textContent }
                    ];
                break;
                case `class_id`:
                    setParams = 
                    [
                        { paramName: SQLRowId,      paramValue: row.cells[0].textContent },
                        { paramName: `name`,        paramValue: row.cells[1].textContent },
                        { paramName: `class_type`,  paramValue: row.cells[2].textContent }
                    ];
            }

            console.log(setParams);
            postInfo(`edit`, setParams, SQLTableName);

            setTimeout(() => {
                closeOverlay(`edit_overlay`);
                showOverlay(`edit_overlay`); 
                getInfo(true, functionArgument);
            }, 100);
        }

        cancelImg.addEventListener('click', () => {
            tableCancel();
        })
        function tableCancel(){
            tableClearAll();

            editImg.style.display = 'inline';
            acceptImg.style.display = 'none';
            cancelImg.style.display = 'none';

            rowContent.forEach(element => { 
                element.textContent = uneditedRowContent.shift();
                checkInput(element);
            });
            table.querySelectorAll('.edit_icon').forEach(element => { element.classList.remove('inactive_icon'); });
            document.querySelector(`.add_button`).style.display = 'inline';
        }
    }
    table.appendChild(thead); 
    table.appendChild(tbody);
    // add the table to the overlay
    overlay.appendChild(table);
}

function tableClearAll(){
    let table = document.querySelector('.edit_table');
    table.querySelectorAll('.edit_icon').forEach(element => { element.style.display = 'inline'; });
    table.querySelectorAll('.accept_icon').forEach(element => { element.style.display = 'none'; });
    table.querySelectorAll('.cancel_icon').forEach(element => { element.style.display = 'none'; });
    table.querySelectorAll('td').forEach(element => { element.contentEditable = 'false'; element.classList.remove('editable_textbox');});
    document.getElementById('edit_list').style.marginTop = '29px';
    document.querySelector('.error_message').style.display = 'none'; 
    document.querySelector(`.add_button`).style.display = 'inline';
}
/**
 * Проверяет входной элемент на наличие ошибок и возвращает флаг, указывающий на наличие ошибок.
 */
function checkInput(element){
    let errFlag = false;
    const row = element.parentElement;
    const table = row.parentElement;
    const errorMessage = document.querySelector('.error_message');
    //console.log(element.textContent, row.className);
    switch(row.className){
        case `teacher_row`:
        case `class_row`:
            if(/^[\p{Letter}\s-]+$/u.test(element.textContent) && element.textContent.length < 30){
                errFlag = false;   
            }
            else{
                errFlag = true;
            }
            break;
        case `group_row`:
        case `room_row`:
            if(/^[0-9]+$/.test(element.textContent)){
                errFlag = false;
            }
            else{
                errFlag = true;

            }
        break;
    }
    //ok
    if(!errFlag && element.textContent.length > 0){
            element.classList.remove(`error`);
            errFlag = false;
    }
    //err   
    else{
            element.classList.add(`error`);
            //row.querySelector('.accept_icon').classList.add('inactive_icon');
            errFlag = true;
    }
    Array.from(row.getElementsByClassName('editable_textbox')).every(td => {
        if(td.classList.contains('error')) {
            row.querySelector('.accept_icon').classList.add('inactive_icon');
            console.log(td, 'error');
            errorMessage.style.display = 'block';
            table.querySelectorAll('.edit_icon').forEach(element => { element.classList.add('inactive_icon'); });
            document.getElementById('edit_list').style.marginTop = '0px';
            document.querySelector(`.add_button`).style.display = 'none';
            return false;
        }
        else{
            errorMessage.style.display = 'none';
            row.querySelector('.accept_icon').classList.remove('inactive_icon');  
            document.getElementById('edit_list').style.marginTop = '29px';
            document.querySelector(`.add_button`).style.display = 'inline';
        }
        return true;
    });
    return errFlag;
}
/**
 * Добавляет новый элемент в таблицу.
 */
function addNewElement(){
    let table = document.getElementById("edit_table_id");
    let lastRow = table.rows[table.rows.length - 1];
    let lastID = lastRow.cells[0].textContent;
    let newID = Number(lastID) + 1;

    // Create a new row
    let newRow = table.insertRow();

    let idCell = newRow.insertCell();
    idCell.textContent = newID;

    let acceptImg = document.querySelector('.accept_icon').cloneNode(true);
    let cancelImg = document.querySelector('.cancel_icon').cloneNode(true);

    const tab = document.getElementById(`edit_choice`);
    const tabName = tab.querySelector(`.active_tab`).id;
    
    let SQLTableName;
    switch(tabName){
        case `group_edit_button`:
            newRow.className = `group_row`;
            SQLTableName = `studentGroups`;
            functionArgument = `groups`;
            break;
        case `teacher_edit_button`:
            newRow.className = `teacher_row`;
            SQLTableName = `teachers`;
            functionArgument = `teachers`;
            break;
        case `room_edit_button`:
            newRow.className = `room_row`;
            SQLTableName = `rooms`;
            functionArgument = `rooms`;
            break;
        case `timeTable_edit_button`:
            newRow.className = `timeTable_row`;
            SQLTableName = `classes`;
            break;
    }

    acceptImg.addEventListener('click', () => {
        let errFlag = false;
        let i = 0;
        let rowContent = newRow.querySelectorAll('.editable_textbox');
        while(!errFlag && i < rowContent.length){
            errFlag = checkInput(rowContent[i]);
            console.log(errFlag, rowContent[i].textContent);
            i++;
        };
        if(errFlag){
            acceptImg.classList.add('inactive_icon');
            alert('Введенные данные содержат недопустимые символы или длинна данных превышает допустимые значения');
        }
        if(acceptImg.classList.contains('inactive_icon')){
            this.removeEventListener('click', ()=> {

                tableSaveNew();
            });
        }
        else{
            tableSaveNew();
        }
    })

    cancelImg.addEventListener('click', (element) => {
        element.target.parentElement.parentElement.remove();
        table.querySelectorAll('.edit_icon').forEach(element => { element.classList.remove('inactive_icon'); });    
        document.getElementById('edit_list').style.marginTop = '29px';
        document.querySelector('.error_message').style.display = 'none'; 
        document.querySelector(`.add_button`).style.display = 'inline';
    });

    // Create and configure new cells for the row
    for (let i = 1; i < lastRow.cells.length - 1; i++) {
        let midCell = newRow.insertCell();
         midCell.contentEditable = "true";
         midCell.classList.add('editable_textbox');
         midCell.addEventListener('input', () => {
            checkInput(midCell);
        });
    }

    let controlCell = newRow.insertCell();
    controlCell.appendChild(acceptImg).style.display = `inline`;
    controlCell.appendChild(cancelImg).style.display = `inline`;
    table.querySelectorAll('.edit_icon').forEach(element => { element.classList.add('inactive_icon'); });

    newRow.scrollIntoView();
    function tableSaveNew(){
        let textContents = Array.from(newRow.cells).slice(0, -1).map(cell => cell.textContent);
        if(SQLTableName === `teachers`){
            let lastTwoElements = textContents.slice(-2).map(item => item.slice(0, 1) + '.');
            textContents = textContents.concat(lastTwoElements);
            textContents = textContents.map((content, index) => 
                index === 0 ? content : content.charAt(0).toUpperCase() + content.slice(1));
        }
        
        //console.log(textContents);
        postInfo(`add`, textContents, SQLTableName);
        setTimeout(() => {
            closeOverlay(`edit_overlay`);
            showOverlay(`edit_overlay`); 
            getInfo(true, functionArgument);
        }, 100);
    }
}
/**
 * Генерирует отфильтрованный список выборов на основе заданного объекта и типа фильтра.
 */
function filterChoice(obj, filterType) {
    const overlay = document.getElementById(`filterList`);
    const searchBar = document.getElementById(`filter_search_bar`);
    
    // Очищаем содержимое элемента overlay
    overlay.innerHTML = '';

    // Итерируемся по объектам и создаем элементы списка
    for (let i = 0; i < obj.length; i++) {
        let li = document.createElement('li');
        let a = document.createElement('a');

        switch (filterType) {
            case `groups`:
                a.innerHTML = obj[i].group_num;
                searchBar.placeholder = '№ Группы';
                document.getElementById("group_button").style.borderBottom = `2px solid rgb(103, 0, 10)`;
                document.getElementById("teacher_button").style.borderBottom = `2px solid white`;
                document.getElementById("room_button").style.borderBottom = `2px solid white`;
                li.setAttribute("onclick", `setGroupsFilter(${obj[i].group_num})`);
                break;
            case `teachers`:
                a.innerHTML = `${obj[i].name}`;
                searchBar.placeholder = 'ФИО преподавателя';
                document.getElementById("group_button").style.borderBottom = `2px solid white`;
                document.getElementById("teacher_button").style.borderBottom = `2px solid rgb(103, 0, 10)`;
                document.getElementById("room_button").style.borderBottom = `2px solid white`;
                li.setAttribute("onclick", `setTeachersFilter(${obj[i].teacher_id}, "${obj[i].name}");`);
                break;
            case `rooms`:
                a.innerHTML = obj[i].room_num;
                searchBar.placeholder = '№ Аудитории';
                document.getElementById("group_button").style.borderBottom = `2px solid white`;
                document.getElementById("teacher_button").style.borderBottom = `2px solid white`;
                document.getElementById("room_button").style.borderBottom = `2px solid rgb(103, 0, 10)`;
                li.setAttribute("onclick", `setRoomsFilter(${obj[i].room_num})`);
                break;
        }
        overlay.appendChild(li);
        li.appendChild(a);
    }
}

/**
 * Поиск элементов в списке на основе заданного значения.
 */
function searchList(id) {
    const input = document.getElementById(id);
    const filter = input.value.toUpperCase();
    let ul = input.parentElement.getElementsByTagName(`ul`)[0];
    if(!ul){
        ul = input.parentElement.parentElement.getElementsByTagName(`ul`)[0];
    }
    const li = ul.getElementsByTagName('li');
    for (let i = 0; i < li.length; i++) {
        let txtValue = '';
        let a = li[i].getElementsByTagName('a');
        for(let j = 0; j < a.length; j++){
            txtValue += a[j].textContent || a[j].innerText;
            //console.log(txtValue);
        }
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}
/**
 * Поиск в таблице заданного значения и отображение соответствующих строк.
 */
function searchTable(){
    let found;
    let input = document.getElementById("edit_search_bar");
    let filter = input.value.toUpperCase();
    let table = document.getElementById("edit_table_id");
    let tr = table.getElementsByTagName("tr");
    for (let i = 1; i < tr.length; i++) {
        let td = tr[i].getElementsByTagName("td");
        for (let j = 0; j < td.length; j++) {
            if (td[j].innerHTML.toUpperCase().indexOf(filter) > -1) { //TextContent
                found = true;
            }
        }
        if (found) {
            tr[i].style.display = "";
            found = false;
        } else {
            tr[i].style.display = "none";
        }
    }
}
/**
 * Устанавливает фильтр по группам на основе указанного номера группы.
 */
function setGroupsFilter(groupNum){
    //console.log(groupNum);
    getInfo(false, `timeTable`,`students`,`${groupNum}`);
    closeOverlay(`groupOverlay`);
    document.getElementById("choice_button").innerHTML = `${groupNum} группа`;
}

/**
 * Устанавливает фильтр по преподавателям на основе указанного идентификатора и имени преподавателя.
 */
function setTeachersFilter(id, name){
    //console.log(name);
    getInfo(false, `timeTable`,`teachers`,`${id}`);
    closeOverlay(`groupOverlay`);
    document.getElementById("choice_button").innerHTML = `${name}`;  
}

/**
 * Устанавливает фильтр по аудиториям на основе указанного номера аудитории.
 */
function setRoomsFilter(roomNum){
    getInfo(false, `timeTable`,`rooms`,`${roomNum}`);
    closeOverlay(`groupOverlay`);
    document.getElementById("choice_button").innerHTML = `${roomNum} аудитория`;
}

/**
* Устанавливает расписание на основе предоставленного объекта и типа.
 */
function setTimetable(obj, type) {
    globalFilterType = type;
    // Сбрасываем фон элемента innerClass
    const innerClassElements = document.querySelectorAll('.inner_class');
    innerClassElements.forEach(element => {
        element.style.backgroundColor = 'transparent';
    });

    // Определяем идентификаторы дней недели
    let daysOfTheWeekID = ['#monday', '#tuesday', '#wednesday', '#thursday', '#friday'];

    
    // Очистим имя класса, тип класса, учителя и местоположение для каждого элемента
    document.querySelectorAll('.class_name').forEach(element => { element.innerHTML = ''; });
    document.querySelectorAll('.class_type').forEach(element => { element.innerHTML = ''; });
    document.querySelectorAll('.teacher').forEach(element => { element.innerHTML = ''; });
    document.querySelectorAll('.location').forEach(element => { element.innerHTML = ''; });
    
    // Инициализируем массивы для четных и нечетных недель
    let evenWeek = [];
    let oddWeek = [];

    // Классифицируем объекты расписания на четные и нечетные недели
    for (let i = 0; i < obj.length; i++) {
        if (obj[i].weekType == 2) {
            evenWeek.push(obj[i]);
        } else if (obj[i].weekType == 1) {
            oddWeek.push(obj[i]);
        }
        //console.log(document.getElementById('week_num').innerHTML, obj[i].weekType);
    }
    // Выбираем подходящую неделю на основе отображаемого номера недели
    let temp = [];
    if (document.getElementById('week_num').innerHTML == 'Четная неделя') {
        temp = evenWeek;
        console.log("even");
    } else {
        temp = oddWeek;
        console.log("odd");

    }

    // Перебираем объекты расписания
    for (let i = 0; i < temp.length; i++) {
        const day = document.querySelector(daysOfTheWeekID[temp[i].dayNum - 1]);
        const classN = day.getElementsByClassName('inner_class');

        // Перебираем элементы класса дня
        for (let j = 0; j < classN.length; j++) {
            const startTime = classN[j].querySelector('.class_start').innerHTML;

            // Устанавливаем имя класса, тип класса, учителя и местоположение на основе объекта и типа расписания
            if (startTime == temp[i].startTime.slice(1, -3) || startTime == temp[i].startTime.slice(0, -3)) {
                classN[j].style.background = `rgb(255, 248, 239)`;
                console.log(temp[i]);

                let address = document.createElement('a');
                address.className = `location`;
                address.href = temp[i].URL;
                address.innerHTML = `${temp[i].address}`;
                classN[j].querySelectorAll('a').forEach(element => {
                    element.remove();
                });
                switch (type) {
                    case 'students':
                        classN[j].querySelector('.class_name').innerHTML = temp[i].class;
                        classN[j].querySelector('.class_type').innerHTML = temp[i].classType;
                        classN[j].querySelector('.teacher').innerHTML = `${temp[i].teacher}`;

                        classN[j].querySelector('.class_info').appendChild(address);
                        classN[j].querySelector('.location').style.display = 'inline';
                        //console.log(temp[i].URL)
                        classN[j].querySelector('.location').innerHTML = `${temp[i].roomNum} ауд., `; 
                    
                        break;
                    case 'teachers':
                        classN[j].querySelector('.class_name').innerHTML = temp[i].class;
                        classN[j].querySelector('.class_type').innerHTML = temp[i].classType;
                        classN[j].querySelector('.teacher').innerHTML = `${temp[i].groupNum} группа`;
                        classN[j].querySelector('.class_info').appendChild(address);
                        classN[j].querySelector('.location').style.display = 'inline';
                        classN[j].querySelector('.location').innerHTML = `${temp[i].roomNum} ауд.`;
                        
                        break;
                    case 'rooms':
                        classN[j].querySelector('.class_name').innerHTML = temp[i].class;
                        classN[j].querySelector('.class_type').innerHTML = temp[i].classType;
                        classN[j].querySelector('.teacher').innerHTML = `${temp[i].teacher}`;
                        classN[j].querySelector('.location').innerHTML = `${temp[i].groupNum} группа`;
                        
                        break;
                }
            }
        }
    }

}
    
/**
 * Показывает оверлей с заданным идентификатором
 */
function showOverlay(id){
    document.getElementById(id).style.display = "block";
    if(id=='groupOverlay'){
        document.getElementById(`group_button`).focus();
    }
}

/**
 * Закрывает оверлей с заданным идентификатором
 */
function closeOverlay(id){
    document.getElementById(id).style.display = "none";
}
/**
 * Меняет неделю, изменяя отступ.
 */
function swapWeek(changeMargin){
    date.setDate(date.getDate() + 7 * changeMargin);
    console.log("click", date.getDate());
    getDate();
    if(globalTimetable.obj && globalTimetable.type){
        //console.log("changing");
        setTimetable(globalTimetable.obj, globalTimetable.type);
    }
    else{
        //console.log('empty');
    }
}
/**
 * Редактирует элемент расписания.
 */
function editTimetableElement(el){
    showOverlay(`edit_row_overlay`);
    console.log(globalFilterType, el, el.parentElement.parentElement);
    let columnNames = [];
    let columnValues = [];
    let table = document.getElementById('element_edit_table');
    if(globalFilterType != 'none'){
        table.style.display = 'table';
        let dayOfTheWeek = el.parentElement.parentElement.querySelector('.week_day_name').innerText.split(',')[0].toLowerCase();
        let timeStart = el.querySelector('.class_start').innerText;
        let timeEnd = el.querySelector('.class_end').innerText;
        //dayOfTheWeek = dayOfTheWeek.charAt(0).toLowerCase() + dayOfTheWeek.slice(1);
        document.getElementById(`element_edit_header`).innerText = `Редактирование пары занятий в ${dayOfTheWeek}, в ${timeStart}-${timeEnd}, по фильтру: "${document.getElementById(`choice_button`).innerText}"`;
        let classType = el.querySelector('.class_type').innerText;
        let discipline = el.querySelector('.class_name').innerText;
        let teacher = el.querySelector('.teacher').innerText;
        let roomNum = el.querySelectorAll('.location')[0].innerText;
        let address = '';
        if(el.getElementsByTagName('a').length > 0) {
            address = el.getElementsByTagName('a')[0].innerText;
        }
        let columnHeaders = table.querySelectorAll('th');  
        let columnCells = table.querySelectorAll('td');
        
        //console.log(el.querySelector('.class_type'), el.querySelector('.class_name'), el.querySelector('.teacher'), el.querySelectorAll('.location')[0], el.getElementsByTagName('a'));

        let requests = [];
        switch (globalFilterType) {
            case 'students':
                columnNames = [`Тип занятий`, `Название дисциплины`, `Преподаватель`, `Аудитория`, `Адрес`];
                columnValues = [classType, discipline, teacher, roomNum, address];
                requests = ['groups', 'teachers', 'rooms'];
            break;
            case 'teachers':
                columnNames = [`Тип занятий`, `Название дисциплины`, `Группа`, `Аудитория`, `Адрес`];
                columnValues = [classType, discipline, teacher, roomNum, address];
            break;
            case 'rooms':
                columnNames = [`Тип занятий`, `Название дисциплины`, `Преподаватель`, `Группа`];
                columnValues = [classType, discipline, teacher, roomNum];
            break;
        }

        //console.log(columnHeaders, columnCells); 
        for (let i = 0; i < columnNames.length; i++) {
            columnHeaders[i].innerText = columnNames[i];
            columnCells[i].querySelector('option').innerText = columnValues[i];
        }
        let acceptImg = document.createElement('img');
        let cancelImg = document.createElement('img');
        let deleteImg = document.createElement('img');
        acceptImg.src = './img/accept.png';
        cancelImg.src = './img/cancel.png';
        deleteImg.src = './img/delete.png';
        acceptImg.className = 'table_control_icon edit_icon';
        cancelImg.className = 'table_control_icon edit_icon';
        deleteImg.className = 'table_control_icon edit_icon';

        columnCells[columnCells.length - 1].appendChild(acceptImg);
        columnCells[columnCells.length - 1].appendChild(cancelImg);
        columnCells[columnCells.length - 1].appendChild(deleteImg);
    }
    else{
        document.getElementById(`element_edit_header`).innerText = `Пожалуйста, выберите фильтр для редактирования пары`;
        table.style.display = 'none';
    }

}
/**
 * Включает режим редактирования для расписания. 
 */
function editModeOn(){
    document.getElementById('top_body_edit_on').style.display = 'none';
    document.getElementById('top_body_edit_off').style.display = 'flex';
    document.querySelectorAll('.edit_button').forEach(element => { element.style.display = 'inline'; });
    const text = document.getElementById(`top_body_text`);
    text.innerHTML = `Расписание занятий (редактирование)`; //ПОТОМ ПОМЕНЯТЬ
    text.style.fontSize = `45px`;

    let timeTableElements = document.querySelectorAll(`.inner_class`);
    timeTableElements.forEach(element => {
        let editElement = document.createElement(`img`);
        editElement.src = `./img/edit.png`;
        editElement.className = `edit_element_button`;
        console.log(element);
        element.appendChild(editElement);
        editElement.addEventListener('click', () => {
            editTimetableElement(element);
        })
    })

}
/**
* Выключает режим редактирования.
*/
function editModeOff(){
    document.getElementById('time_block').style.display = 'inline';
    document.getElementById('top_body_edit_on').style.display = 'flex';
    document.getElementById('top_body_edit_off').style.display = 'none';
    document.querySelectorAll('.edit_button').forEach(element => { element.style.display = 'none'; });
    document.getElementById('choice_button').style.display = 'inline';
    const text = document.getElementById(`top_body_text`);
    text.innerHTML = `Расписание занятий`;
    text.style.fontSize = `50px`;
    document.querySelectorAll(`.edit_element_button`).forEach(element => {
        element.remove();
    });
}
/**
 * Асинхронно выполняет авторизацию пользователя.
 */
async function login(){
    console.log('log');
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let input = {
        username: username,
        password: password
    };
    const res = await fetch(`${baseUrl}/auth`, 
        {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({
                parsel: input
            })
        });
        const data = await res.json();
        console.log(data.status);
    if(data.status === true){
        closeOverlay('login_overlay');
        document.getElementById('login_error').style.display = 'none';
        editModeOn();
    }
    else{
        document.getElementById('login_error').style.display = 'inline';
    }

}