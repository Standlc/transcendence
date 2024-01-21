import { Avatar } from "../UIKit/Avatar";
import InfiniteSlotMachine from "../UIKit/InfiniteSlotMachine";

interface props {
  secondsBeforeGameEnd: number;
  playerUsername: string;
}

export default function GameDisconnectionModal({
  secondsBeforeGameEnd,
  playerUsername,
}: props) {
  //   const { user } = useContext(UserContext);

  return (
    <div className="z-10 fixed top-0 left-0 h-full w-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="font-title flex-col gap-5 bg-[rgb(36,40,50)] bg-opacity-100 p-5 flex items-center justify-center border-solid border-[rgb(255,255,255,0.2)] rounded-lg">
        <div className="text-xl font-title flex items-center bg-[rgb(54,59,74)] rounded-lg p-4">
          <div className="mr-3">
            <Avatar imgUrl={undefined} size="md" />
          </div>
          <span className="font-[900] mr-2">{playerUsername}</span>
          <span>left the game</span>
        </div>

        <div className="flex justify-start gap-2">
          <span className="text-3xl font-title">You win in</span>
          <span className="text-3xl font-title font-[900]">
            <InfiniteSlotMachine state={secondsBeforeGameEnd} />
          </span>
        </div>
      </div>
    </div>
  );
}
