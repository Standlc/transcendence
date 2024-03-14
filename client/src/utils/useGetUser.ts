import { AppUser } from "@api/types/clientSchema";
import { useQueryClient } from "@tanstack/react-query"

export const useGetUser = () => {
	const queryClient = useQueryClient();
	return (queryClient.getQueryData<AppUser>(["user"])) as AppUser;
}
