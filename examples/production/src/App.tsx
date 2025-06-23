import { Download, SquareArrowOutUpRight } from "lucide-react";

import { Button } from "@toriistudio/glow-ui";
import { Playground, useControls } from "@toriistudio/v0-playground";

function BasicComponent() {
  const { text, variant, glowColor, isGlowing } = useControls(
    {
      text: { type: "string", value: "Hello World" },
      variant: {
        type: "select",
        value: "default",
        options: ["default", "secondary", "ghost"],
      },
      glowColor: { type: "color", value: "#ff1b6f" },
      isGlowing: { type: "boolean", value: true },
      download: {
        type: "button",
        render: () => (
          <Button
            isGlowing={false}
            className="w-full py-2 text-sm bg-stone-700 hover:bg-stone-600 text-white rounded"
            onClick={() => alert("Coming soon")}
          >
            <Download />
          </Button>
        ),
      },
      open: {
        type: "button",
        render: () => (
          <Button
            isGlowing={false}
            className="w-full py-2 text-sm bg-stone-700 hover:bg-stone-600 text-white rounded"
            onClick={() =>
              window.open(
                "https://v0.dev/chat/glow-button-open-in-v0-RtKueF3HPpW",
                "_blank"
              )
            }
          >
            <SquareArrowOutUpRight />
          </Button>
        ),
      },
    },
    {
      componentName: "GlowButton",
    }
  );

  return (
    <Button
      glowColor={glowColor}
      isGlowing={isGlowing}
      variant={variant as "default" | "secondary" | "ghost"}
    >
      {text}
    </Button>
  );
}

export default function App() {
  return (
    <Playground>
      <BasicComponent />
    </Playground>
  );
}
