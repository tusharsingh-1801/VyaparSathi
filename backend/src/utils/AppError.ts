// A small typed error so controllers can throw with an HTTP status code attached,
// and the central error handler knows what to send back.
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
