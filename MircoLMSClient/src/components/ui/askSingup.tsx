export default function AskSignup({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="w-1/2 h-full relative z-10 flex my-[200px] pl-[270px] justify-center">
      <div className="text-white text-center pr-20 transition-all duration-1000 group-hover:scale-105">
        <h1 className="!font-poppins !text-[32px] !font-semibold">
          New here ?
        </h1>
        <p className="mt-2 !font-poppins">Then Sign Up and Start Learning!</p>
        <button
          onClick={onSwitch}
          className="!rounded-full !text-[12px] my-3 font-semibold !font-poppins border-2 border-white px-10 py-[10px] transition-all duration-200 hover:scale-105"
        >
          SIGN UP
        </button>
      </div>
    </div>
  );
}