/**
 * @author Vincent Dumestre
 * @author Nathan Krupa
 */

function FileLoader() {
    this.fileReader;
    this.init();
}


Object.assign(FileLoader.prototype,{
    init : function(){
        if (typeof window.FileReader !== 'function') {
            console.warn('This Browser doesn\'t support the FileReaderAPI');
            return;
        }
        this.fileReader= new FileReader();
    },

    setOnProgress : function(fct){
        this.fileReader.onprogress = fct;
    },

    setOnLoad : function(fct){
        this.fileReader.onload = fct;
    },

    readAsArrayBuffer : function(input){
        this.fileReader.readAsArrayBuffer(input.files[0]);
    },

    getResult : function(){
        return this.fileReader.result;
    }
});
