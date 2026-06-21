import { Module } from "@medusajs/framework/utils";
import { MailModule } from "../../types";
import MailModuleService from "./service";

export default Module(MailModule, { service: MailModuleService });
