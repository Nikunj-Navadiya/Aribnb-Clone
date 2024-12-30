import { Suspense } from "react";
import { MapFilterItems } from "./components/MapFilterItems";
import prisma from "./lib/db";
import { SkeltonCard } from "./components/SkeletonCard";
import { NoItems } from "./components/NoItem";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ListingCard } from "./components/ListingCard";
import { unstable_noStore as noStore } from "next/cache";

async function getData({
  searchParams,
  userId,
}: {
  userId: string | undefined;
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    room?: string;
    bathroom?: string;
  };
}) {
  noStore(); // Ensures no caching for this data fetch
  try {
    const data = await prisma.home.findMany({
      where: {
        addedCategory: true,
        addedLoaction: true,
        addedDescription: true,
        categoryName: searchParams?.filter || undefined,
        country: searchParams?.country || undefined,
        guest: searchParams?.guest ? parseInt(searchParams.guest) : undefined,
        bedroms: searchParams?.room ? parseInt(searchParams.room) : undefined,
        bathroms: searchParams?.bathroom
          ? parseInt(searchParams.bathroom)
          : undefined,
      },
      select: {
        photo: true,
        id: true,
        price: true,
        description: true,
        country: true,
        Favorite: {
          where: {
            userId: userId || undefined,
          },
        },
      },
    });

    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export default function Home({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    room?: string;
    bathroom?: string;
  };
}) {
  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />

      <Suspense key={searchParams?.filter} fallback={<SkeletonLoading />}>
        <ShowItems searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShowItems({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    room?: string;
    bathroom?: string;
  };
}) {
  const { getUser } = getKindeServerSession();
  let user;

  try {
    user = await getUser();
  } catch (error) {
    console.error("Error fetching user session:", error);
    user = undefined;
  }

  const data = await getData({ searchParams, userId: user?.id });

  return (
    <>
      {data.length === 0 ? (
        <NoItems
          description="Please check another category or create your own listing!"
          title="Sorry, no listings found for this category..."
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
          {data.map((item) => (
            <ListingCard
              key={item.id}
              description={item.description ?? ""}
              imagePath={item.photo ?? ""}
              location={item.country ?? ""}
              price={item.price ?? 0}
              userId={user?.id}
              favoriteId={item.favorite[0]?.id}
              isInFavoriteList={item.Favorite.length > 0}
              homeId={item.id}
              pathName="/"
            />
          ))}
        </div>
      )}
    </>
  );
}

function SkeletonLoading() {
  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
      <SkeltonCard />
    </div>
  );
} 