const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const INTERVAL_MS = 80;
const LABEL = "linear-worktree";
const CLEAR_LINE = "\r[2K";

export type Progress = {
  step: (message: string) => void;
  done: (message?: string) => void;
};

export function withPrefix(progress: Progress, prefix: string): Progress {
  return {
    step: (message) => progress.step(`${prefix}${message}`),
    done: (message) => progress.done(message ? `${prefix}${message}` : undefined),
  };
}

export function createProgress(stream: NodeJS.WritableStream = process.stderr): Progress {
  const isTty = Boolean((stream as Partial<NodeJS.WriteStream>).isTTY);

  if (!isTty) {
    return {
      step(message) {
        stream.write(`[${LABEL}] ${message}\n`);
      },
      done(message) {
        if (message) {
          stream.write(`[${LABEL}] ${message}\n`);
        }
      },
    };
  }

  let current = "";
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  const render = (): void => {
    stream.write(`${CLEAR_LINE}${FRAMES[frame % FRAMES.length]} ${current}`);
    frame += 1;
  };

  return {
    step(message) {
      current = message;
      if (!timer) {
        timer = setInterval(render, INTERVAL_MS);
        if (typeof timer.unref === "function") {
          timer.unref();
        }
      }
      render();
    },
    done(message) {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
      stream.write(CLEAR_LINE);
      if (message) {
        stream.write(`[${LABEL}] ${message}\n`);
      }
    },
  };
}
