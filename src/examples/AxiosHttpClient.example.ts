// import { IHttpClient, HttpOptions } from '../http';

// Example implementation using axios
// User needs to install: npm install axios

// import axios from 'axios';
//
// export class AxiosHttpClient implements IHttpClient {
//   private axiosInstance;
//
//   constructor(timeout = 5000) {
//     this.axiosInstance = axios.create({ timeout });
//   }
//
//   async post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T> {
//     const response = await this.axiosInstance.post(url, data, {
//       headers: options?.headers,
//     });
//     return response.data;
//   }
//
//   async get<T>(url: string, options?: HttpOptions): Promise<T> {
//     const response = await this.axiosInstance.get(url, {
//       headers: options?.headers,
//     });
//     return response.data;
//   }
// }
