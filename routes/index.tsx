import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";
import { MainLand } from "../islands/main.tsx";
import {
  validateID,
  validateURL,
} from "https://deno.land/x/ytdl_core@v0.1.2/mod.ts";
import { YouTube } from "https://deno.land/x/youtube_sr/mod.ts";

export default function Home() {
  const count = useSignal(3);
  return (
    <div class="container mx-auto min-h-[100svh]">
      <MainLand />
    </div>
  );
}

export const handler = {
  async POST(req: Request): Promise<Response> {
    const value = await req.text();
    if (validateURL(value)) {
      //get video by url
      console.log("url");

      return Response.json({
        type: "video",
        data: await YouTube.getVideo(value),
      });
    } else if (validateID(value)) {
      //get video by id
      console.log("id");

      return Response.json({
        type: "video",
        data: await YouTube.getVideo(
          new URL(value, "https://youtu.be").toString(),
        ),
      });
    } else {
      const result = await YouTube.search(value);
      console.log(result);
      return Response.json({
        type: "search",
        data: result,
      });
    }
  },
};
