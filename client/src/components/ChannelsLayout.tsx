import { Outlet } from "react-router-dom"
import { ChanColumn } from "./ChanColumn"

export const ChannelsLayout = () => {
	return (
		<div className="flex">
			<ChanColumn />
			<Outlet />
		</div>
	)
}
