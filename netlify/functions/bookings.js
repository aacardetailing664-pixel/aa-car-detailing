import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event) {
  // GET booked times
  if (event.httpMethod === "GET") {
    const date = event.queryStringParameters.date;
    if (!date) {
      return { statusCode: 400, body: "Missing date" };
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", date);

    if (error) {
      return { statusCode: 500, body: error.message };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data.map(b => b.booking_time))
    };
  }

  // POST new booking
  if (event.httpMethod === "POST") {
    const { date, time } = JSON.parse(event.body);

    const { error } = await supabase
      .from("bookings")
      .insert([{ booking_date: date, booking_time: time }]);

    if (error) {
      return { statusCode: 409, body: "Slot already booked" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
}

