import axios from "axios";
import { User } from "../types/interfaces/UserInterface";

export const getMe = async (): Promise<User> => {
    const res = await axios.get<User>("/api/user/me");
    return res.data;
};
