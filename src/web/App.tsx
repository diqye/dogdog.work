/**
 * 前端入口路由。
 */

import { Route, Switch } from "wouter";
import { CardPage } from "./pages/CardPage";
import { HelloPage } from "./pages/HelloPage";

export function App() {
  return (
    <Switch>
      <Route path="/" component={CardPage} />
      <Route path="/hello" component={HelloPage} />
      <Route>
        <div className="min-h-[50vh] flex items-center justify-center text-ink-soft">页面不存在</div>
      </Route>
    </Switch>
  );
}
