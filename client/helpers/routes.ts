import { Season } from '@/types/Season'

export const makeSeasonPaths = (seasons: Season[]) => {
  return {
    paths: seasons.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}
