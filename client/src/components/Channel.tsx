import { Timestamp } from "@api/types/schema";
import { useParams } from "react-router-dom";

export const Channel = () => {
    const { channelId } = useParams();
    return (
        <div>
            <h2>Channel id = {channelId}</h2>
        </div>
    );
};
