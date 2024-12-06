// resources/js/hooks/useApi.ts
import { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "@/Lib/axios";
import axios from "axios";

type FnOnSucsess = (response: axios.AxiosResponse) => void;
type FnOnError = (error: unknown) => void;
type FnOnFinaly = () => void;

export function useApi() {
    const [loading, setLoading] = useState(false);

    const request = async (
        method: string,
        url: string,
        data?: any,
        onSuccess?: FnOnSucsess,
        onError?: FnOnError,
        onFinaly?: FnOnFinaly
    ) => {
        setLoading(true);
        try {
            const response = await axiosInstance({ method, url, data });
            toast.success(response.data.message);
            onSuccess && onSuccess(response);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data.message;
                toast.error(message);
            }
            onError && onError(error);
            throw error;
        } finally {
            onFinaly && onFinaly();
            setLoading(false);
        }
    };

    return {
        loading,
        get: (
            url: string,
            onSuccess?: FnOnSucsess,
            onError?: FnOnError,
            onFinaly?: FnOnFinaly
        ) => request("get", url, onSuccess, onError, onFinaly),
        post: (
            url: string,
            data: any,
            onSuccess?: FnOnSucsess,
            onError?: FnOnError,
            onFinaly?: FnOnFinaly
        ) => request("post", url, data, onSuccess, onError, onFinaly),
        put: (
            url: string,
            data: any,
            onSuccess?: FnOnSucsess,
            onError?: FnOnError,
            onFinaly?: FnOnFinaly
        ) => request("put", url, data, onSuccess, onError, onFinaly),
        delete: (
            url: string,
            onSuccess?: FnOnSucsess,
            onError?: FnOnError,
            onFinaly?: FnOnFinaly
        ) => request("delete", url, onSuccess, onError, onFinaly),
    };
}
