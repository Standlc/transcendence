const BASKETBALL_COURT_WOOD = [
  [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
];

export const BasketballCourt = () => {
  return (
    <div className="absolute h-full w-full overflow-hidden flex items-center justify-center">
      <div className=" flex items-center absolute h-[70%] w-[30%] rounded-r-full bg-white bg-opacity-0 left-0 [outline:2px_solid_rgba(255,255,255,0.6)]">
        <div className=" absolute h-[29%] aspect-square bg-red-800 bg-opacity-60 left-0 [outline:2px_solid_rgba(255,255,255,0.6)]">
          <div className="absolute h-full aspect-square translate-x-[50%] rounded-full [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
        </div>
      </div>

      <div className="flex flex-col h-full w-full">
        {Array(3)
          .fill(0)
          .map(() =>
            BASKETBALL_COURT_WOOD.map((line, i) => (
              <div key={i} className="flex flex-1 w-full">
                {line.map((color, i) => (
                  <div
                    key={i}
                    style={{ opacity: `${color * 100}%` }}
                    className="h-full flex-1 bg-red-900 bg-opacity-5"
                  ></div>
                ))}
              </div>
            ))
          )}
      </div>

      <div className=" absolute h-[20%] aspect-square rounded-full bg-red-800 bg-opacity-50 [outline:2px_solid_rgba(255,255,255,0.6)]"></div>

      <div className=" absolute h-full w-[2px] bg-white bg-opacity-60"></div>

      <div className=" flex items-center absolute h-[70%] w-[30%] rounded-l-full bg-white bg-opacity-0 right-0 [outline:2px_solid_rgba(255,255,255,0.6)]">
        <div className=" absolute h-[29%] aspect-square bg-red-800 bg-opacity-50 right-0 [outline:2px_solid_rgba(255,255,255,0.6)]">
          <div className="absolute h-full aspect-square translate-x-[-50%] rounded-full [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
        </div>
      </div>
    </div>
  );
};

const TennisCourt = () => {
  return (
    <div className="flex flex-col absolute  h-full w-full overflow-hidden items-center justify-center">
      <div className="w-full border-b-[2px] bg-black bg-opacity-15 h-[10%] border-[rgba(255,255,255,0.6)]"></div>
      <div className="h-full w-[50%] flex items-center">
        <div className="bg-white bg-opacity-60 w-[2px] h-full"></div>
        <div className="bg-white bg-opacity-60 w-full h-[2px]"></div>
        <div className="bg-white bg-opacity-60 w-[2px] h-full"></div>
      </div>
      <div className="w-full border-t-[2px] bg-black bg-opacity-15 h-[10%] border-[rgba(255,255,255,0.6)]"></div>
    </div>
  );
};

const SoccerCourt = () => {
  return (
    <div className="flex flex-col absolute  h-full w-full overflow-hidden items-center justify-center">
      <div className="absolute flex h-full w-full">
        {Array(5)
          .fill(0)
          .map(() =>
            [0, 1].map((opacity, i) => (
              <div
                key={i}
                style={{
                  opacity: `${opacity * 5}%`,
                }}
                className="h-full flex-1 bg-black"
              ></div>
            ))
          )}
      </div>

      <div className="absolute h-[5%] aspect-square rounded-full left-0 top-0 translate-x-[-50%] translate-y-[-50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
      <div className="absolute h-[5%] aspect-square rounded-full right-0 top-0 translate-x-[50%] translate-y-[-50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
      <div className="absolute h-[5%] aspect-square rounded-full bottom-0 left-0 translate-x-[-50%] translate-y-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
      <div className="absolute h-[5%] aspect-square rounded-full bottom-0 right-0 translate-x-[50%] translate-y-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>

      <div className="absolute flex items-center left-0 w-[20%] h-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]">
        <div className="absolute left-0 w-[35%] h-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
        <div className="absolute border-l-transparent border-b-transparent border-[2px] border-[rgba(255,255,255,0.6)] right-0 translate-x-[50%] rotate-45 rounded-full h-[40%] aspect-square"></div>
      </div>

      <div className="absolute [outline:2px_solid_rgba(255,255,255,0.6)] rounded-full h-[20%] aspect-square"></div>
      <div className="bg-white bg-opacity-60 w-[2px] h-full"></div>

      <div className="absolute flex items-center right-0 w-[20%] h-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]">
        <div className="absolute right-0 w-[35%] h-[50%] [outline:2px_solid_rgba(255,255,255,0.6)]"></div>
        <div className="absolute border-r-transparent border-b-transparent border-[2px] border-[rgba(255,255,255,0.6)] left-0 translate-x-[-50%] -rotate-45 rounded-full h-[40%] aspect-square"></div>
      </div>
    </div>
  );
};

const BilliardsCourt = () => {
  return (
    <div className="flex flex-col absolute  h-full w-full overflow-hidden items-center justify-center p-[20px]">
      <div className="h-full w-full flex justify-center bg-[#23583b] p-[20px]">
        <div className="h-full w-[2px] flex flex-col">
          <DashedLine />
          <div className="w-full bg-opacity-60 flex-1 bg-white" />
        </div>
      </div>

      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute left-[10px] top-[10px]"></div>
      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute top-[10px]"></div>
      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute right-[10px] top-[10px]"></div>

      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute left-[10px] bottom-[10px]"></div>
      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute bottom-[10px]"></div>
      <div className="h-[20px] aspect-square bg-[rgb(25,25,25)] rounded-full absolute right-[10px] bottom-[10px]"></div>
    </div>
  );
};

const ClassicCourt = () => {
  return (
    <div className="flex flex-col absolute  h-full w-full overflow-hidden items-center justify-center">
      <div className="absolute  h-full w-full overflow-hidden flex items-center justify-center">
        <div className=" absolute h-[100%] aspect-square rounded-full bg-black opacity-10 left-0 -translate-x-[80%]"></div>
        <div className=" absolute h-[40%] aspect-square rounded-full bg-black opacity-10 "></div>
        <div className=" absolute h-[100%] aspect-square rounded-full bg-black opacity-10 right-0 translate-x-[80%]"></div>
      </div>
      <div className="h-full w-[2px] flex flex-col">
        <DashedLine />
        <div className="w-full bg-opacity-60 flex-1 bg-white" />
      </div>
    </div>
  );
};

const DashedLine = () => {
  return Array(7)
    .fill(0)
    .map(() =>
      [1, 0].map((opacity, i) => (
        <div
          key={i}
          style={{
            opacity: `${opacity * 60}%`,
          }}
          className="w-full flex-1 bg-white"
        />
      ))
    );
};

// const Ball = () => {
//   return (
//     <div className="absolute h-[18px] flex rounded-full items-center justify-center aspect-square bg-zinc-800 overflow-hidden shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]">
//       <div className="absolute h-[20%] w-[20%] top-[3px] rounded-full bg-white blur-[2px]"></div>
//       <div className="h-[9px] mb-[2px] aspect-square bg-white flex items-center justify-center rounded-full text-[8px] text-black">
//         8
//       </div>
//       <div className="absolute left-0 translate-x-[-80%] h-[150%] aspect-square border-[1px] border-white rounded-full"></div>
//       <div className="absolute right-0 translate-x-[80%] h-[150%] aspect-square border-[1px] border-white rounded-full"></div>
//       <div className="absolute h-full w-[1px] bg-black"></div>
//       <div className="absolute h-[1px] w-full bg-black"></div>
//     </div>
//   );
// };

export const GAME_STYLES = {
  Classic: {
    primary: "#6754e1",
    secondary: "rgb(229 170 95)",
    court: <ClassicCourt />,
  },
  Dark: {
    primary: "rgb(30 30 30)",
    secondary: "",
    court: <ClassicCourt />,
  },
  Basketball: {
    primary: "rgb(229 170 95)",
    secondary: "rgb(214 116 80)",
    court: <BasketballCourt />,
  },
  Tennis: {
    primary: "rgb(50 79 109)",
    secondary: "",
    court: <TennisCourt />,
  },
  Soccer: {
    // rgb(55 103 41)
    primary: "rgb(50 112 50)",
    secondary: "",
    court: <SoccerCourt />,
  },
  Billiards: {
    primary: "#352520",
    secondary: "#352520",
    court: <BilliardsCourt />,
  },
};
