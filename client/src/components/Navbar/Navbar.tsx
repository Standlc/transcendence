import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NavBar = () => {
	const navigate = useNavigate();

	return (
		<div className="navbar bg-discord-black">
			<button
				className="mt-4 p-2 rounded-full bg-not-quite-black"
				style={{ height: '60px', width: '60px' }}
				>
				user
			</button>
			{/*TODO: component for chan */}
			<button
				className="mt-4 p-2 rounded-full bg-blurple"
				style={{ height: '60px', width: '60px' }}
			>
				chat 1
			</button>
			{/* TODO: Play component */}
			<button
				className="mt-4 p-2 rounded-full bg-blurple"
				style={{ height: '60px', width: '60px' }}
			>
				Play
			</button>
			{/*TODO: invite component*/}
			<button
				className="mt-4 p-2 text-3xl text-green rounded-full bg-not-quite-black"
				style={{ height: '60px', width: '60px' }}
			>
				+
			</button>

		</div>
	);
};
