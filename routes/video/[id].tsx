import { Handlers, PageProps } from "$fresh/server.ts";
import {
  cache,
  downloadFromInfo,
  getInfo,
} from "https://deno.land/x/ytdl_core@v0.1.2/mod.ts";
import {
  VideoFormat,
  VideoInfo,
} from "https://deno.land/x/ytdl_core@v0.1.2/src/types.ts";
import DlIsland from "../../islands/dl-island.tsx";
import * as msgpack from "https://deno.land/std@0.206.0/msgpack/mod.ts";

export const handler: Handlers<VideoInfo> = {
  async GET(_req, ctx) {
    const video = await getInfo(ctx.params["id"] as string);
    return ctx.render(video);
  },
  async POST(req) {
    const { info, format } = await req.json() as {
      info: VideoInfo;
      format: VideoFormat;
    };
    const stream = await downloadFromInfo(info, { format });

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const tempFile = await Deno.makeTempFile({
      suffix: ".webm",
    });
    await Deno.writeFile(
      tempFile,
      new Uint8Array(await (new Blob(chunks).arrayBuffer())),
    );
    const command = new Deno.Command("ffmpeg", {
      args: ["-i", tempFile, `${tempFile}.mp3`],
      stderr: "piped",
    }).spawn();
    await command.output();
    // await command.stderr.pipeTo(Deno.stdout.writable)
    await Deno.remove(tempFile);
    try {
      return new Response(
        new Blob([await Deno.readFile(`${tempFile}.mp3`)], {
          type: "audio/mpeg",
        }),
        {
          headers: {
            "Content-Disposition": `inline; filename="${
              encodeURIComponent(info.videoDetails.title)
            }.mp3"`,
          },
        },
      );
    } finally {
      console.log("done sending response");
    }
  },
};

export default function VideoPage(data: PageProps<VideoInfo>) {
  return <DlIsland info={data.data} />;
}
