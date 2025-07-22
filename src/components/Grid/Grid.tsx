function Grid() {
  return (
    <div
      className="absolute inset-0 w-screen h-screen z-[0] blur-[1px]"
      style={{
        backgroundImage: `
      linear-gradient(to right,rgb(13, 13, 13) 1px, transparent 1px),
      linear-gradient(to bottom,rgb(13, 13, 13) 1px, transparent 1px)
    `,
        backgroundSize: "1rem 1rem",
        backgroundPosition: "center",
      }}
    />
  );
}

export default Grid;
