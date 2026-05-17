import axios, { AxiosRequestConfig } from 'axios';

export type RequestConfig<D, IfSuccess, IfError> = Omit<AxiosRequestConfig<D> & {
    /**
     * 이 요청이 성공했는지 확인하는 콜백
     * @returns 성공 여부
     */
    "isSuccess"?: (data: IfSuccess | IfError, status: number) => boolean;

}, "url" | "validateStatus">;
export type RequestSuccessResponse<T = any> = RequestBaseResponse<T, true>;
export type RequestErrorResponse<T = any> = RequestBaseResponse<T, false>;

export interface RequestBaseResponse<T = any, Success = boolean> {
    "status": number;
    "data": T;
    "success": Success;
}

export type RequestResponse<S = any, E = any> = RequestSuccessResponse<S> | RequestErrorResponse<E>;

export default async function REST<IfSuccess = any, IfError = any, Data = any>(route: string, config: RequestConfig<Data, IfSuccess, IfError>): Promise<RequestResponse<IfSuccess, IfError>> {
    try {
        const rawTokenExpiresAt = localStorage.getItem("expires_at");
        if (rawTokenExpiresAt) {
            const expiresAt = Number(rawTokenExpiresAt);
            if (isNaN(expiresAt)) {
                console.error("expiresAt was NaN. (at REST function)");
                throw new Error("예기치 않은 오류입니다.");
            }

            if (expiresAt < new Date().getTime()) {
                // /api/auth/refresh에 요청 넣고 성공하면 요청 진행, 실패하면 throw

                
            }
        }
        config.isSuccess = (_, s) => Math.floor(s / 100) === 2;

        const headers = {
            ...config.headers,
            "Authorization": localStorage.getItem("access_token")
        }

        const t = new Date();
        const r = await axios({
            ...config,
            "validateStatus": () => true,
            "url": route,
            headers
        });
        const status = r.status;
        console.log(config.method ?? "GET", route, r.status, (new Date().getTime() - t.getTime()) + "ms");

        if (config.isSuccess && !config.isSuccess(r.data, status)) {
            return {
                status,
                "data": r.data,
                "success": false
            };
        }

        return {
            status,
            "data": r.data,
            "success": true
        };
    } catch (err) {
        throw err;
    }
}
