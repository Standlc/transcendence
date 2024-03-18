export const NoResult = ({ description }: { description: string }) => {
  return (
    <div className="h-full w-full opacity-50 text-lg flex items-center justify-center text-center">
      {description}
    </div>
  );
};
