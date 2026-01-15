import { Component, ViewEncapsulation } from '@angular/core';
import { Login } from '../login/login';
import { Register } from '../register/register';


@Component({
  selector: 'app-auth-shell',
  imports: [Login, Register],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
  encapsulation: ViewEncapsulation.None,
})
export class AuthShell {

}
