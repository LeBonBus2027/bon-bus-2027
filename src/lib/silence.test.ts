import { describe, expect, it } from "vitest";
import { SILENCE_SONDAGES, silenceSondages } from "./candidats";

// Silence des sondages : la veille et le jour de chaque tour (loi du 19 juillet 1977), élargi du vendredi 0 h au lundi 0 h (Paris).
describe("silence des sondages", () => {
  const t = (iso: string) => Date.parse(iso);
  it("couvre les deux tours, du vendredi 0 h au lundi 0 h, heure de Paris", () => {
    expect(SILENCE_SONDAGES).toHaveLength(2);
    expect(silenceSondages(t("2027-04-15T23:59:59+02:00"))).toBe(false);
    expect(silenceSondages(t("2027-04-16T00:00:00+02:00"))).toBe(true);
    expect(silenceSondages(t("2027-04-17T12:00:00-04:00"))).toBe(true);   // samedi, vote aux Antilles
    expect(silenceSondages(t("2027-04-18T20:00:00+02:00"))).toBe(true);   // dimanche, fermeture des bureaux
    expect(silenceSondages(t("2027-04-19T00:00:00+02:00"))).toBe(false);
    expect(silenceSondages(t("2027-04-25T12:00:00+02:00"))).toBe(false);  // entre les deux tours
    expect(silenceSondages(t("2027-05-01T12:00:00+02:00"))).toBe(true);
    expect(silenceSondages(t("2027-05-02T19:59:00+02:00"))).toBe(true);
    expect(silenceSondages(t("2027-05-03T00:00:00+02:00"))).toBe(false);
  });
  it("les périodes tombent bien sur un vendredi et finissent un lundi", () => {
    for (const p of SILENCE_SONDAGES) {
      expect(new Date(p.debut).toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" })).toBe("vendredi");
      expect(new Date(p.fin).toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" })).toBe("lundi");
    }
  });
});
