import axios, { AxiosRequestConfig } from 'axios';
import refreshSession from './refreshSession';

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

export default async function REST<IfSuccess = any, IfError = any, Data = any>(route: string, config?: RequestConfig<Data, IfSuccess, IfError>): Promise<RequestResponse<IfSuccess, IfError>> {
    try {
        const rawTokenExpiresAt = localStorage.getItem("expires_at");
        if (rawTokenExpiresAt) {
            const expiresAt = Number(rawTokenExpiresAt);
            if (isNaN(expiresAt)) {
                console.error("expiresAt was NaN. (at REST function)");
                throw new Error("예기치 않은 오류입니다.");
            }

            if (expiresAt < new Date().getTime()) {
                await refreshSession();

                return await REST<IfSuccess, IfError, Data>(route, config);
            }
        }
        const rConfig = config ?? {};
        rConfig.isSuccess = (_, s) => Math.floor(s / 100) === 2;

        const headers = {
            ...rConfig.headers,
            "Authorization": localStorage.getItem("access_token")
        }

        const r = await axios({
            ...rConfig,
            "validateStatus": () => true,
            "url": route,
            headers
        });
        const status = r.status;

        if (r.status === 401 || r.status === 403) {
            const authError = (r.data as APIAuthError).code;
            if (authError === "INVALID_TOKEN") {
                await refreshSession();

                return await REST<IfSuccess, IfError, Data>(route, config);
            }
        }

        if (rConfig.isSuccess && !rConfig.isSuccess(r.data, status)) {
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
