class ApiResponce {
    constructor(statusCode, deta, message= "Success"){
        this.statusCode = statusCode
        this.deta = deta
        this.message = message
        this.Success = statusCode <400
    }
}