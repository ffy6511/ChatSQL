import Image from "next/image";
import DatabaseFlow from "../components/DatabaseFlow";
import { parseJSONToTables } from "../lib/parseMySQL";

export default function Home() {
  const jsonData = [
    {
      tableName: "users",
      columns: [
        { name: "id", type: "INT", isPrimary: true },
        { name: "username", type: "VARCHAR(50)", isPrimary: false },
        { name: "email", type: "VARCHAR(100)", isPrimary: false },
        { name: "created_at", type: "TIMESTAMP", isPrimary: false },
      ],
      foreignKeys: [
        {
          column: "email",
          references: { table: "orders", column: "user_id" },
        },
      ],
    },
    {
      tableName: "orders",
      columns: [
        { name: "order_id", type: "INT", isPrimary: true },
        { name: "user_id", type: "INT", isPrimary: false },
        { name: "order_date", type: "TIMESTAMP", isPrimary: false },
        { name: "total_amount", type: "DECIMAL(10,2)", isPrimary: false },
      ],
      foreignKeys: [
        { column: "user_id", references: { table: "users", column: "id" } },
      ],
    },
  ];

  const tables = parseJSONToTables(jsonData);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <DatabaseFlow tables={tables}/>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
