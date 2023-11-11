import type {
  VideoFormat,
  VideoInfo,
} from "https://deno.land/x/ytdl_core@v0.1.2/src/types.ts";
import { Signal, useSignal } from "@preact/signals";
import { format } from "$std/path/win32.ts";
import * as msgpack from "https://deno.land/std@0.206.0/msgpack/mod.ts";
import { z } from "https://esm.sh/zod";

function removeDuplicates<T extends {}>(array: T[], property: keyof T) {
  const seen = new Set();
  const filteredArray = [];

  for (const item of array) {
    const itemValue = item[property];

    if (!seen.has(itemValue)) {
      filteredArray.push(item);
      seen.add(itemValue);
    }
  }

  return filteredArray;
}

export default function DlIsland({ info }: { info: VideoInfo }) {
  const downloading = useSignal(false);
  const status = useSignal("");
  return (
    <div>
      {info.videoDetails.title}
      <ul>
        {removeDuplicates(
          info.formats.filter((f) => f.hasAudio),
          "quality",
        ).map((f) => {
          return (
            <li>
              <button
                onClick={() => {
                  download(info, f, {
                    downloading,
                    status,
                  });
                }}
                class={"border p-3 shadow-xl"}
              >
                {f.quality}
              </button>
            </li>
          );
        })}
      </ul>
      {downloading.value
        ? (
          <>
            {status.value}
          </>
        )
        : false}
    </div>
  );
}

async function download(info: VideoInfo, format: VideoFormat, signals: {
  downloading: Signal<boolean>;
  status: Signal<string>;
}) {
  const body = { info, format };
  signals.downloading.value = true;
  signals.status.value = "Downloading";
  await fetch(location.href, {
    method: "POST",
    body: JSON.stringify(body),
  }).then(async (resp) => {
    const titleHeader = resp.headers.get("content-disposition")!.split(";").map(
      (part) => part.trim(),
    ).at(1)!.match(/filename=\"(.*)"/)!;
    const title = decodeURIComponent(titleHeader[1]);
    const blob = await resp.blob();
    const file = new File([blob], title);
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.download = title;
    a.href = url;
    a.hidden = true;
    a.click();
  });
  signals.status.value = "Thanks for using me :)";
}

const Schema = z.union([
  z.object({
    type: z.literal("info"),
    message: z.string(),
  }),
  z.object({
    type: z.literal("progress"),
    value: z.number(),
  }),
]);

function parseMessage(data: Uint8Array) {
  try {
    const message = msgpack.decode(data);
    return Schema.parse(message);
  } catch (e) {
    try {
      const recovered = msgpack.decode(data.slice(data.length / 2));
      return Schema.parse(recovered);
    } catch {
      return {
        type: "info",
        message: "",
      };
    }
  }
}
