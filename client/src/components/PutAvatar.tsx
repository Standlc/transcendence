import { LoginResponse } from "./RequireAuth/AuthProvider";
import defaultAvatar from "../components/defaultAvatar.png";

interface Props {
    loginResponse: LoginResponse | null;
}

export const PutAvatar: React.FC<Props> = ({ loginResponse }: Props) => {
    if (loginResponse?.avatarUrl) {
        return (
            <>
                <div className="avatar bg-greyple mt-6">
                    <img
                        className="rounded-full"
                        src={loginResponse.avatarUrl}
                        alt="avatar"
                    />
                </div>
            </>
        );
    } else {
        return (
            <>
                <span className="avatar bg-greyple mt-6">
                    <img className="rounded-full" src={defaultAvatar} alt="avatar" />
                </span>
            </>
        );
    }
};
