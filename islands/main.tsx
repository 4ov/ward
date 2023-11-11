import { useEffect, useState } from "preact/hooks";
import { Video } from "https://deno.land/x/youtube_sr/mod.ts";

type Result = {
  type: "search";
  data: Video[];
} | {
  type: "video";
  data: Video;
};

function useDelay(fn: CallableFunction, ms: number, deps: any[]) {
  const [waiter, setWaiter] = useState<number | undefined>(undefined);
  useEffect(() => {
    clearTimeout(waiter);
    setWaiter(setTimeout(() => {
      fn();
    }, ms));
  }, deps);
}

export function MainLand() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  useDelay(
    async () => {
      if (value) {
        setLoading(true);
        const result = await fetch(location.href, {
          method: "POST",
          body: value,
        }).then((d) => d.json()) as Result;
        if (result.type === "search") {
          console.log(result.data);
          setLoading(false);
          setVideos(result.data);
        }else{
            console.log(result.data);
            
            setVideos([result.data])
            
        }
      }
    },
    1500,
    [value],
  );
  return (
    <div class={"flex flex-col"}>
      <input
        type="text"
        class={"border m-auto p-3"}
        onInput={(ev) => {
          setValue(ev.currentTarget.value);
        }}
      />
      <div>
        {loading ? "..." : (
          <div class={"p-3 flex flex-col gap-3"}>
            {videos.map((v) => {
              return (
                <a class="w-fit bg-red-300 border p-3 max-w-[300px]" href={`/video/${v.id}`}>
                  {v.thumbnail?.url && <img src={v.thumbnail.url} alt="" width={96} />}
                  <h2>{v.title}</h2>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
