"use client";

import Loading from "@/src/components/loading";
import css from './page.module.css';
import Header from "@/src/components/header";

export default function Page() {

    return <div className={css.container}>
        <Header />
    </div>;
}