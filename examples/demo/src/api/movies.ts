import { json } from "../router/response";

export default function GET() {
	// Letterboxd top 20
	return json([
		{ title: "Harakiri", year: 1962 },
		{ title: "Come and See", year: 1985 },
		{ title: "12 Angry Men", year: 1957 },
		{ title: "Seven Samurai", year: 1954 },
		{ title: "The Godfather: Part II", year: 1974 },
		{ title: "High and Low", year: 1963 },
		{ title: "Parasite", year: 2019 },
		{ title: "The Godfather", year: 1972 },
		{ title: "The Human Condition III: A Soldier’s Prayer", year: 1961 },
		{ title: "The Shawshank Redemption", year: 1994 },
		{ title: "Yi Yi", year: 2000 },
		{ title: "City of God", year: 2002 },
		{ title: "Schindler’s List", year: 1993 },
		{ title: "Ikiru", year: 1952 },
		{ title: "La Haine", year: 1995 },
		{ title: "Ran", year: 1985 },
		{ title: "A Brighter Summer Day", year: 1991 },
		{ title: "The Lord of the Rings: The Return of the King", year: 2003 },
		{ title: "The Good, the Bad and the Ugly", year: 1966 },
		{ title: "The Human Condition I: No Greater Love", year: 1959 },
	]);
}
