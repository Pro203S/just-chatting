"use client";

import css from './page.module.css';
import Header from "@/src/components/header";

export default function Page() {

    return <div className={css.container}>
        <Header />
    </div>;
}