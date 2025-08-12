import CityClient from "../../../components/CityClient";

type Props = { params: { id: string } };

export default function CityPage({ params }: Props) {
  const { id } = params;
  return <CityClient cityId={id} />;
}


