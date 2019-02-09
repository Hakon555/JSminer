'use strict';

class MinerModel{

    constructor(width, height, minesQuantity) {
        this.width = width;
        this.height = height;
        this.minesQuantity = (width * height > minesQuantity) ? minesQuantity : width * height - 1;
        this.field = [];
        this.openedField = [];
        this.viewListeners = [];
        this.gameId = 0;
        this.gameEnded = false;
    }

    initialization(idCell){

        let minePositions = [];

        for(let i = 0; i < this.minesQuantity; i++){

            let number = parseInt(getRandomArbitrary(0, this.width * this.height));

            if((idCell && number === idCell) || minePositions.indexOf(number) !== -1){
                i--;
                continue;
            }
            minePositions.push(number);
        }

        for(let i = 0; i < this.height; i++){
            for(let j = 0; j < this.width; j++){

                if(!this.field[i])
                    this.field[i] = [];
                if(!this.openedField[i])
                    this.openedField[i] = [];

                this.field[i][j] = {
                    type: (minePositions.indexOf(this.convertPosition([i, j])) === -1) ? "empty" : "mine", //"empty", "mine", "number"
                    number: 0,
                    protected: false
                };
                this.openedField[i][j] = {
                    type: "empty", //"empty", "mine", "number", "flag"
                    number: 0,
                    opened: false
                };
            }
        }

        for(let i = 0; i < this.field.length; i++){
            for(let j = 0; j < this.field[i].length; j++){

                if(this.field[i][j].type === "mine"){
                    let circleArr = this.getCellsAround([i,j], this.field);

                    for(let k = 0; k < circleArr.length; k++){

                        let cell = this.field[circleArr[k][0]][circleArr[k][1]];
                        if(cell.type !== "mine"){
                            cell.type = "number";
                            cell.number++;
                        }
                    }
                }
            }
        }
        function getRandomArbitrary(min, max) {
            return Math.random() * (max - min) + min;
        }
    }

    actionModel(event){
        switch (event.typeAction){
            case "newGame":
                this.newGame(event.width, event.height, event.mines);
                break;
            case "mouseButton":
                if(this.gameEnded) break;
                if(!parseInt(event.target.dataset.idcell) && parseInt(event.target.dataset.idcell) !== 0) break;

                if(event.button === 0){
                    this.mainAction(parseInt(event.target.dataset.idcell));
                }
                if(event.button === 2 && this.field[0]){
                    this.secondAction(parseInt(event.target.dataset.idcell));
                }
                break;
        }
    }

    mainAction(idCell){
        let outputObject = this.createStartOutputObject();

        if(!this.field[0]) {
            this.initialization(idCell);
            outputObject.firstAction = true;
        }
        
        let position = this.convertPosition(idCell);

        if(this.field[position[0]][position[1]].protected){
            this.actionCellProtected(position, outputObject);
        }else{
            this.checkCellType(position, outputObject);
            this.checkWin(outputObject);
        }

        this.fillOutputObject(outputObject, this.openedField);
        this.callViewListeners(outputObject);
    }

    secondAction(idCell){
        let position = this.convertPosition(idCell);
        let outputObject = this.createStartOutputObject();
        let cellObject = this.openedField[position[0]][position[1]];

        if(cellObject.type === "flag" || (cellObject.type === "empty" && !cellObject.opened)) {
            if (!cellObject.opened) {
                this.field[position[0]][position[1]].protected = true;
                cellObject.opened = true;
                cellObject.type = "flag";
            } else {
                this.field[position[0]][position[1]].protected = false;
                cellObject.opened = false;
                cellObject.type = "empty";
            }
            outputObject.changedField.push(position);
            this.checkWin(outputObject);
        }else{
            this.actionCellProtected(position, outputObject);
        }

        this.fillOutputObject(outputObject, this.openedField);
        this.callViewListeners(outputObject);
    }

    newGame(width, height, minesQuantity){
        this.field = [];
        this.openedField = [];
        this.width = width;
        this.height = height;
        this.minesQuantity = (width * height > minesQuantity) ? minesQuantity : width * height - 1;
        this.gameEnded = false;

        let preId = parseInt(Math.random()*1000);
        if(this.gameId !== preId)
            this.gameId = preId;

        let outputObject = this.createStartOutputObject();
        outputObject.width = width;
        outputObject.height = height;
        outputObject.minesQuantity = this.minesQuantity;
        outputObject.newGame = true;

        this.callViewListeners(outputObject);
    }

    createStartOutputObject(){
        return {
            win: false,
            loose: false,
            skip: false,
            openedField: [],
            changedField: [],
            gameId: this.gameId,
            gameEnded: false
        };
    }

    callViewListeners(obj){
        for(let i = 0; i < this.viewListeners.length; i++){
            this.viewListeners[i][0].call(this.viewListeners[i][1], obj);
        }
    }

    setViewListener(func, cnt){
        this.viewListeners.push([func, cnt]);
    }

    fillOutputObject(preObj, arrForWriting){
        for(let i = 0; i < arrForWriting.length; i++){
            for(let j = 0; j < arrForWriting[i].length; j++){
                preObj.openedField[i] = arrForWriting[i];
            }
        }
    }

    checkWin(obj){
        for(let i = 0; i < this.height; i++){
            for(let j = 0; j < this.width; j++){
                if(this.field[i][j].type !== this.openedField[i][j].type){
                    if(this.field[i][j].type === "mine" && this.openedField[i][j].type === "flag"){
                        continue;
                    }
                    return false;
                }
                if(this.openedField[i][j].type === "mine"){
                    return false;
                }
            }
        }
        this.gameEnded = true;
        obj.gameEnded = true;
        obj.win = true;
    }

    getCellsAround(position, arr){
        let circleArr = [
            [position[0] - 1, position[1] - 1],
            [position[0] - 1, position[1]],
            [position[0] - 1, position[1] + 1],
            [position[0], position[1] - 1],
            [position[0], position[1] + 1],
            [position[0] + 1, position[1] - 1],
            [position[0] + 1, position[1]],
            [position[0] + 1, position[1] + 1]
        ];
        for(let i = 0; i < circleArr.length; i++){
            if(circleArr[i][0] < 0 || circleArr[i][0] > (arr.length - 1) || circleArr[i][1] < 0 || circleArr[i][1] > (arr[0].length - 1)){
                circleArr.splice(i, 1);
                i--;
            }
        }
        return circleArr;
    }

    actionCellEmpty(position, obj, specArr = []){

        let makeTargetAction = (position, obj, specArr) => {
            this.openedField[position[0]][position[1]].type = this.field[position[0]][position[1]].type;
            this.openedField[position[0]][position[1]].number = this.field[position[0]][position[1]].number;
            this.openedField[position[0]][position[1]].opened = true;
            this.field[position[0]][position[1]].protected = false;
            obj.changedField.push(position);
            specArr.push(this.convertPosition(position));
        };

        makeTargetAction(position, obj, specArr);

        let circleArr = this.getCellsAround(position, this.field);

        for(let i = 0; i < circleArr.length; i++){
            if(specArr.indexOf(this.convertPosition(circleArr[i])) === -1){
                if(this.field[circleArr[i][0]][circleArr[i][1]].type === "empty"){
                    this.actionCellEmpty(circleArr[i], obj, specArr);
                }else{
                    makeTargetAction(circleArr[i], obj, specArr);
                }
            }
        }
    }

    actionCellNumber(position, obj){
        this.openedField[position[0]][position[1]].type = this.field[position[0]][position[1]].type;
        this.openedField[position[0]][position[1]].number = this.field[position[0]][position[1]].number;
        this.openedField[position[0]][position[1]].opened = true;
        obj.changedField.push(position);
        this.field[position[0]][position[1]].protected = true;
    }

    actionCellMine(position, obj){
        obj.loose = true;
        obj.changedField.length = 0;
        for(let i = 0; i < this.field.length; i++){
            for(let j = 0; j < this.field[i].length; j++){
                this.openedField[i][j].type = this.field[i][j].type;
                this.openedField[i][j].number = this.field[i][j].number;
                this.openedField[i][j].opened = true;
                this.field[i][j].protected = true;
            }
        }
        this.gameEnded = true;
        obj.gameEnded = true;
    }

    checkCellType(position, outputObject){
        switch(this.field[position[0]][position[1]].type){
            case "mine":
                this.actionCellMine(position, outputObject);
                break;
            case "number":
                this.actionCellNumber(position, outputObject);
                break;
            case "empty":
                this.actionCellEmpty(position, outputObject);
                break;
        }
    }

    actionCellProtected(position, obj){
        obj.skip = true;
    }

    convertPosition(forConvert){
        if(typeof forConvert === "number"){
            let outPos = [];

            outPos[0] = parseInt(forConvert / this.width);
            outPos[1] = forConvert - this.width * outPos[0];

            return outPos;
        }else{
            return (forConvert[0] * this.width + forConvert[1]);
        }
    }
}

class MinerView{

    constructor(upperId){
        this.upperBlock = document.getElementById(upperId);
        this.field = document.getElementById(upperId).getElementsByClassName("field")[0];
        this.gameId = 0;
        this.arrCells = [];
        this.cellWidth = 25;
        this.timeCounterId = -1;
        this.minesQuantity = 0;
        this.width = 0;
        this.height = 0;
        this.time = 0;
    }

    rebuiltView(obj){
        if(obj.gameId !== this.gameId && obj.newGame){
            this.minesQuantity = obj.minesQuantity;
            this.width = obj.width;
            this.height = obj.height;
            this.generateCells(obj);
            this.showHideWin("hide");
            this.timeCounter("clear");
        }

        if(!obj.changedField[0]){
            if(!obj.skip){
                let changedField = [];
                for(let i = 0; i < obj.openedField.length; i++){
                    for(let j = 0; j < obj.openedField[0].length; j++){
                        changedField.push([i,j]);
                    }
                }
                this.refreshField(changedField, obj);
            }
        }else{
            if(obj.firstAction){
                this.timeCounterId = this.timeCounter("start");
            }
            this.refreshField(obj.changedField, obj);
        }

        if(obj.loose){
            this.showLoose();
        }else{
            if(obj.win){
                this.showHideWin("show");
            }
        }
    }

    generateCells(obj){
        this.gameId = obj.gameId;
        this.upperBlock.setAttribute("data-gameid", obj.gameId);
        this.field.innerHTML = "";
        this.resizeField(this.width);

        this.mineCounter("new");

        for(let i = 0; i < this.height; i++){
            for(let j = 0; j < this.width; j++){
                if(!this.arrCells[i])
                    this.arrCells[i] = [];

                let id = this.converterToId([i ,j], this.width);

                let div = document.createElement('div');
                div.className = "cell";
                div.setAttribute("data-idcell", id);
                this.arrCells[id] = div;
                this.field.appendChild(div);
            }
        }
    }

    resizeField(width){
        this.upperBlock.style.width = width * this.cellWidth + "px";
    }

    refreshField(changedField, obj){

        for(let i = 0; i < changedField.length; i++) {

            let cell = this.arrCells[this.converterToId([changedField[i][0], changedField[i][1]], obj.openedField[0].length)];
            let cellFromModel = obj.openedField[changedField[i][0]][changedField[i][1]];

            if(cell.classList.contains("flag")){
                this.mineCounter("remove");
            }

            cell.innerHTML = "";
            cell.className = "cell";

            if (cellFromModel.opened) {

                if(cellFromModel.type === "flag"){
                    this.mineCounter("add");
                }

                cell.classList.add(cellFromModel.type);

                if (cellFromModel.type === "number") {
                    cell.innerHTML = cellFromModel.number;
                    let numberClass = "one";

                    switch (cellFromModel.number) {
                        case 1:
                            numberClass = "one";
                            break;
                        case 2:
                            numberClass = "two";
                            break;
                        case 3:
                            numberClass = "three";
                            break;
                        case 4:
                            numberClass = "four";
                            break;
                        case 5:
                            numberClass = "five";
                            break;
                        case 6:
                            numberClass = "six";
                            break;
                        case 7:
                            numberClass = "seven";
                            break;
                        case 8:
                            numberClass = "eight";
                            break;
                    }
                    cell.classList.add(numberClass);
                }
            }
        }
    }

    converterToId (pos, width){
        return width * pos[0] + pos[1];
    }

    showHideWin(selector){
        let windowWin = this.upperBlock.getElementsByClassName("win")[0];

        if(selector === "hide"){
            windowWin.style.display = "none";
        }
        if(selector === "show"){
            console.log("win");
            let sec = this.timeCounter("stop");
            windowWin.style.display = "block";
            this.upperBlock.getElementsByClassName("game-time")[0].innerHTML = sec;
        }
    }

    showLoose(){
        this.timeCounter("stop");
        console.log("loose");
    }
    timeCounter(command){
        let elemGameTime = this.upperBlock.getElementsByClassName("time")[0];

        if(command === "start"){
            elemGameTime.innerHTML = "0";
            this.time = 0;
            return setInterval(()=>{
                this.time++;
                elemGameTime.innerHTML = this.time + "";
            }, 1000);
        }
        if(command === "stop"){
            clearInterval(this.timeCounterId);
            this.timeCounterId = -1;
            return this.time;
        }
        if(command === "clear"){
            clearInterval(this.timeCounterId);
            this.timeCounterId = -1;
            elemGameTime.innerHTML = "0";
        }
    }
    mineCounter(command){
        let elementMineLeft = this.upperBlock.getElementsByClassName("mine-left")[0];
        if(command === "new"){
            elementMineLeft.innerHTML = this.minesQuantity + "";
        }
        if(command === "add"){
            elementMineLeft.innerHTML = parseInt(elementMineLeft.innerHTML) - 1 + "";
        }
        if(command === "remove"){
            elementMineLeft.innerHTML = parseInt(elementMineLeft.innerHTML) + 1 + "";
        }
    }
}
class MinerController{
    constructor(id, modelFunc, modelObj){
        this.gameBlockId = document.getElementById(id);
        this.modelFunc = modelFunc;
        this.modelObj = modelObj;
    }

    enableController(){
        this.removeStandartActions(["field", "new-game", "start-game"]);
        this.enableMenu("menu");
        this.enableField("field");
        this.enableHotKeys();
    }
    enableHotKeys(){
        window.onkeydown = (event) => {
            if(event.keyCode === 113){
                this.startNewGame();
            }
        };
    }
    removeStandartActions(arrSelectors){
        for(let i = 0; i < arrSelectors.length; i++){

            this.gameBlockId.getElementsByClassName(arrSelectors[i])[0].onmousedown =  function (event) {
                return false;
            };
            this.gameBlockId.getElementsByClassName(arrSelectors[i])[0].onselectstart = function (event) {
                return false;
            };
            this.gameBlockId.getElementsByClassName(arrSelectors[i])[0].oncontextmenu = function (event) {
                return false;
            };
        }
    }
    enableField(selector){
        this.gameBlockId.getElementsByClassName(selector)[0].onclick = (event) => {
            event.typeAction = "mouseButton";
            this.modelFunc.call(this.modelObj, event);
            return false;
        };
        this.gameBlockId.getElementsByClassName(selector)[0].oncontextmenu = (event) => {
            event.typeAction = "mouseButton";
            this.modelFunc.call(this.modelObj, event);
            return false;
        };
    }
    startNewGame(){
        let width = parseInt(this.gameBlockId.querySelectorAll("#width")[0].value);
        let height = parseInt(this.gameBlockId.querySelectorAll("#height")[0].value);
        let mines = parseInt(this.gameBlockId.querySelectorAll("#mines")[0].value);

        if(width > 0 && height > 0 && mines > 0){
            this.modelFunc.call(this.modelObj, {
                typeAction: "newGame",
                width,
                height,
                mines
            });
        }
    }
    enableMenu(selector){
        let newGameForm = this.gameBlockId.getElementsByClassName("new-game-form")[0];
        let newGameButton = this.gameBlockId.getElementsByClassName("new-game")[0]

        this.gameBlockId.getElementsByClassName(selector)[0].onclick = (event) => {
            if(event.target.classList.contains("new-game")){
                if(event.target.classList.contains("active")){
                    event.target.classList.remove("active");
                    newGameForm.style.display = "none";
                }else{
                    event.target.classList.add("active");
                    newGameForm.style.display = "block";
                }
            }
            if(event.target.classList.contains("start-game")){
                this.startNewGame();
                newGameButton.classList.remove("active");
                newGameForm.style.display = "none";
            }
            if(event.target.classList.contains("chooseGame")){
                let type = event.target.getAttribute("id");
                let width = this.gameBlockId.querySelectorAll("#width")[0];
                let height = this.gameBlockId.querySelectorAll("#height")[0];
                let mines = this.gameBlockId.querySelectorAll("#mines")[0];

                switch (type){
                    case "novice":
                        width.value = 9;
                        height.value = 9;
                        mines.value = 10;
                        this.blockingInputSizes(width, height, mines, true);
                        break;
                    case "advanced":
                        width.value = 16;
                        height.value = 16;
                        mines.value = 40;
                        this.blockingInputSizes(width, height, mines, true);
                        break;
                    case "master":
                        width.value = 30;
                        height.value = 16;
                        mines.value = 99;
                        this.blockingInputSizes(width, height, mines, true);
                        break;
                    case "custom":
                        this.blockingInputSizes(width, height, mines, false);
                        break;
                }


            }
        };
    }
    blockingInputSizes(width, height, mines, sel){
        if(sel){
            width.setAttribute("disabled", "");
            height.setAttribute("disabled", "");
            mines.setAttribute("disabled", "");
        }else{
            width.removeAttribute("disabled");
            height.removeAttribute("disabled");
            mines.removeAttribute("disabled");
        }
    }
}

class Miner{
    constructor(gameBlockId){
        this.model = new MinerModel(9, 9, 10);
        this.view = new MinerView(gameBlockId);
        this.controller = new MinerController(gameBlockId, this.model.actionModel, this.model);
    }
    startGame(width, height, mineQuantity){
        this.model.setViewListener(this.view.rebuiltView, this.view);
        this.controller.enableController();
        this.model.newGame(width, height, mineQuantity);
    }
}
let game = new Miner("miner");
game.startGame(9, 9, 10);