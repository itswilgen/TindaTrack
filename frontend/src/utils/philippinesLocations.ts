import {
  philippineCitiesByProvince,
  philippineProvinces,
} from "../data/philippinesLocations";

export function getProvinceOptions() {
  return philippineProvinces;
}

export function getCityMunicipalityOptions(provinceCode: string) {
  return philippineCitiesByProvince[provinceCode] || [];
}
