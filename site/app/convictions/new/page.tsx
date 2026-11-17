import ConvictionList from "@/components/convictions/ConvictionList";
import ExposureMap from "@/components/convictions/ExposureMap";
import NewConviction from "@/components/convictions/NewConviction";

export const metadata = { title: "New conviction" };

export default function NewConvictionPage() {
  return (
    <>
      <ExposureMap />
      <div className="md">
        <ConvictionList />
        <NewConviction />
      </div>
    </>
  );
}
